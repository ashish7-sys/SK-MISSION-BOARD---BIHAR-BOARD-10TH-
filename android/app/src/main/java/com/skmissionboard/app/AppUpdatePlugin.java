package com.skmissionboard.app;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Arrays;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "AppUpdatePlugin")
public class AppUpdatePlugin extends Plugin {

    private static final String TAG = "AppUpdatePlugin";
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private volatile boolean isDownloadCancelled = false;
    private HttpURLConnection activeConnection = null;

    @PluginMethod
    public void getInstalledVersion(PluginCall call) {
        try {
            Context context = getContext();
            PackageManager pm = context.getPackageManager();
            PackageInfo pInfo = pm.getPackageInfo(context.getPackageName(), 0);

            long versionCode;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                versionCode = pInfo.getLongVersionCode();
            } else {
                versionCode = pInfo.versionCode;
            }

            JSObject ret = new JSObject();
            ret.put("versionCode", versionCode);
            ret.put("versionName", pInfo.versionName != null ? pInfo.versionName : "1.0.0");
            ret.put("packageName", context.getPackageName());
            ret.put("isNativeAndroid", true);
            ret.put("firstInstallTime", pInfo.firstInstallTime);
            ret.put("lastUpdateTime", pInfo.lastUpdateTime);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Error fetching installed version", e);
            call.reject("Failed to get installed version: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void canRequestPackageInstalls(PluginCall call) {
        try {
            Context context = getContext();
            boolean canInstall = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                canInstall = context.getPackageManager().canRequestPackageInstalls();
            }
            JSObject ret = new JSObject();
            ret.put("canInstall", canInstall);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to check install permissions: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        try {
            Context context = getContext();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + context.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                call.resolve(new JSObject().put("success", true));
            } else {
                call.resolve(new JSObject().put("success", true).put("message", "Permission not required on Android < 8.0"));
            }
        } catch (Exception e) {
            call.reject("Failed to open install settings: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void verifyApk(PluginCall call) {
        String filePath = call.getString("filePath");
        JSObject result = performApkVerification(filePath);
        call.resolve(result);
    }

    private JSObject performApkVerification(String filePath) {
        JSObject ret = new JSObject();
        Context context = getContext();

        if (filePath == null || filePath.trim().isEmpty()) {
            File defaultApk = getUpdateApkFile();
            if (defaultApk.exists()) {
                filePath = defaultApk.getAbsolutePath();
            } else {
                ret.put("isValid", false);
                ret.put("errorReason", "APK_FILE_NOT_FOUND");
                ret.put("errorMessage", "APK फाइल स्टोरेज में नहीं मिली। कृपया पुनः डाउनलोड करें।");
                return ret;
            }
        }

        File apkFile = new File(filePath);
        if (!apkFile.exists() || apkFile.length() <= 0) {
            ret.put("isValid", false);
            ret.put("errorReason", "APK_FILE_EMPTY");
            ret.put("errorMessage", "APK फाइल खाली या अधूरी है (File length: " + apkFile.length() + " bytes)");
            return ret;
        }

        try {
            PackageManager pm = context.getPackageManager();
            int flags = PackageManager.GET_ACTIVITIES;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                flags |= PackageManager.GET_SIGNING_CERTIFICATES;
            } else {
                flags |= PackageManager.GET_SIGNATURES;
            }

            PackageInfo apkInfo = pm.getPackageArchiveInfo(apkFile.getAbsolutePath(), flags);
            if (apkInfo == null) {
                ret.put("isValid", false);
                ret.put("errorReason", "APK_CORRUPT");
                ret.put("errorMessage", "Downloaded APK इस app के compatible update के रूप में verify नहीं हुआ (अमान्य या दूषित पैकेज)।");
                return ret;
            }

            String currentPackage = context.getPackageName();
            if (!currentPackage.equals(apkInfo.packageName)) {
                ret.put("isValid", false);
                ret.put("errorReason", "PACKAGE_NAME_MISMATCH");
                ret.put("errorMessage", "पैकेज नाम मेल नहीं खाता (Expected: " + currentPackage + ", Got: " + apkInfo.packageName + ")");
                return ret;
            }

            long installedVersionCode = 0;
            try {
                PackageInfo currentInfo = pm.getPackageInfo(currentPackage, 0);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    installedVersionCode = currentInfo.getLongVersionCode();
                } else {
                    installedVersionCode = currentInfo.versionCode;
                }
            } catch (Exception e) {
                Log.w(TAG, "Could not fetch current installed versionCode", e);
            }

            long apkVersionCode;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                apkVersionCode = apkInfo.getLongVersionCode();
            } else {
                apkVersionCode = apkInfo.versionCode;
            }

            if (apkVersionCode <= installedVersionCode) {
                ret.put("isValid", false);
                ret.put("errorReason", "VERSION_NOT_HIGHER");
                ret.put("errorMessage", "डाउनलोड किया गया APK नया नहीं है (APK Build: #" + apkVersionCode + ", Current Build: #" + installedVersionCode + ")");
                return ret;
            }

            // Verify Signing Signatures Compatibility
            try {
                PackageInfo installedInfo = pm.getPackageInfo(currentPackage, PackageManager.GET_SIGNATURES);
                if (installedInfo.signatures != null && installedInfo.signatures.length > 0 &&
                    apkInfo.signatures != null && apkInfo.signatures.length > 0) {
                    Signature installedSig = installedInfo.signatures[0];
                    Signature apkSig = apkInfo.signatures[0];
                    if (!installedSig.equals(apkSig)) {
                        ret.put("isValid", false);
                        ret.put("errorReason", "SIGNING_CERTIFICATE_MISMATCH");
                        ret.put("errorMessage", "APK की Signing Certificate वर्तमान ऐप से मेल नहीं खाती। यह अपडेट इंस्टॉल नहीं हो सकता।");
                        return ret;
                    }
                }
            } catch (Exception sigEx) {
                Log.w(TAG, "Signature check notice (non-fatal): " + sigEx.getMessage());
            }

            ret.put("isValid", true);
            ret.put("apkVersionCode", apkVersionCode);
            ret.put("apkVersionName", apkInfo.versionName != null ? apkInfo.versionName : "2.0.0");
            ret.put("apkPackageName", apkInfo.packageName);
            ret.put("filePath", apkFile.getAbsolutePath());
            ret.put("fileSizeBytes", apkFile.length());
            return ret;

        } catch (Exception e) {
            Log.e(TAG, "APK Verification Exception", e);
            ret.put("isValid", false);
            ret.put("errorReason", "VERIFICATION_EXCEPTION");
            ret.put("errorMessage", "APK सत्यापन में त्रुटि: " + e.getMessage());
            return ret;
        }
    }

    @PluginMethod
    public void downloadApk(PluginCall call) {
        String downloadUrl = call.getString("url");
        if (downloadUrl == null || downloadUrl.trim().isEmpty()) {
            call.reject("Download URL is required");
            return;
        }

        final String finalUrl = downloadUrl.trim();
        isDownloadCancelled = false;

        executor.execute(() -> {
            File targetFile = getUpdateApkFile();
            File tempFile = new File(targetFile.getParentFile(), "update_download_temp.apk");

            try {
                if (!targetFile.getParentFile().exists()) {
                    targetFile.getParentFile().mkdirs();
                }

                if (tempFile.exists()) {
                    tempFile.delete();
                }

                URL url = new URL(finalUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setInstanceFollowRedirects(true);
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(30000);
                conn.setRequestProperty("User-Agent", "SKMissionBoard-Android-AppUpdate/2.0");
                conn.setRequestProperty("Accept", "*/*");
                conn.connect();

                int responseCode = conn.getResponseCode();
                // Handle manual redirects if necessary
                int redirects = 0;
                while ((responseCode == HttpURLConnection.HTTP_MOVED_PERM ||
                        responseCode == HttpURLConnection.HTTP_MOVED_TEMP ||
                        responseCode == HttpURLConnection.HTTP_SEE_OTHER ||
                        responseCode == 307 || responseCode == 308) && redirects < 5) {
                    String newUrl = conn.getHeaderField("Location");
                    conn.disconnect();
                    url = new URL(newUrl);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(30000);
                    conn.setRequestProperty("User-Agent", "SKMissionBoard-Android-AppUpdate/2.0");
                    conn.connect();
                    responseCode = conn.getResponseCode();
                    redirects++;
                }

                activeConnection = conn;

                if (responseCode != HttpURLConnection.HTTP_OK) {
                    throw new Exception("HTTP error code " + responseCode + " from server");
                }

                long totalBytes = conn.getContentLength();
                InputStream input = conn.getInputStream();
                FileOutputStream output = new FileOutputStream(tempFile);

                byte[] buffer = new byte[8192];
                long downloadedBytes = 0;
                int bytesRead;
                long lastNotifyTime = 0;

                while ((bytesRead = input.read(buffer)) != -1) {
                    if (isDownloadCancelled) {
                        output.close();
                        input.close();
                        tempFile.delete();
                        mainHandler.post(() -> {
                            JSObject cancelRet = new JSObject();
                            cancelRet.put("status", "cancelled");
                            notifyListeners("downloadCancelled", cancelRet);
                        });
                        return;
                    }

                    output.write(buffer, 0, bytesRead);
                    downloadedBytes += bytesRead;

                    long now = System.currentTimeMillis();
                    if (now - lastNotifyTime > 200 || downloadedBytes == totalBytes) {
                        lastNotifyTime = now;
                        final long dl = downloadedBytes;
                        final long tot = totalBytes;
                        final int progress = tot > 0 ? (int) ((dl * 100) / tot) : 0;

                        mainHandler.post(() -> {
                            JSObject progressObj = new JSObject();
                            progressObj.put("downloadedBytes", dl);
                            progressObj.put("totalBytes", tot);
                            progressObj.put("progress", progress);
                            notifyListeners("downloadProgress", progressObj);
                        });
                    }
                }

                output.flush();
                output.close();
                input.close();

                if (targetFile.exists()) {
                    targetFile.delete();
                }
                boolean renamed = tempFile.renameTo(targetFile);
                if (!renamed) {
                    throw new Exception("Failed to rename temporary APK to final target file.");
                }

                // Verify APK integrity immediately after download
                JSObject verification = performApkVerification(targetFile.getAbsolutePath());
                boolean isValid = verification.optBoolean("isValid", false);

                mainHandler.post(() -> {
                    if (isValid) {
                        JSObject completeObj = new JSObject();
                        completeObj.put("status", "ready");
                        completeObj.put("filePath", targetFile.getAbsolutePath());
                        completeObj.put("fileSizeBytes", targetFile.length());
                        completeObj.put("apkVersionCode", verification.optLong("apkVersionCode", 200));
                        completeObj.put("apkVersionName", verification.optString("apkVersionName", "2.0.0"));
                        notifyListeners("downloadComplete", completeObj);
                        call.resolve(completeObj);
                    } else {
                        String errMsg = verification.optString("errorMessage", "APK सत्यापन विफल रहा।");
                        JSObject errObj = new JSObject();
                        errObj.put("status", "error");
                        errObj.put("errorReason", verification.optString("errorReason", "APK_VERIFICATION_FAILED"));
                        errObj.put("errorMessage", errMsg);
                        notifyListeners("downloadError", errObj);
                        call.reject(errMsg, verification);
                    }
                });

            } catch (Exception e) {
                Log.e(TAG, "Native Download failed", e);
                if (tempFile.exists()) {
                    tempFile.delete();
                }
                mainHandler.post(() -> {
                    JSObject errObj = new JSObject();
                    errObj.put("status", "error");
                    errObj.put("errorReason", "NETWORK_DOWNLOAD_ERROR");
                    errObj.put("errorMessage", "APK डाउनलोड विफल: " + e.getMessage());
                    notifyListeners("downloadError", errObj);
                    call.reject("APK Download failed: " + e.getMessage(), e);
                });
            } finally {
                if (activeConnection != null) {
                    try {
                        activeConnection.disconnect();
                    } catch (Exception ignored) {}
                    activeConnection = null;
                }
            }
        });
    }

    @PluginMethod
    public void cancelDownload(PluginCall call) {
        isDownloadCancelled = true;
        if (activeConnection != null) {
            try {
                new Thread(() -> {
                    try {
                        if (activeConnection != null) activeConnection.disconnect();
                    } catch (Exception ignored) {}
                }).start();
            } catch (Exception ignored) {}
        }
        call.resolve(new JSObject().put("success", true));
    }

    @PluginMethod
    public void installApk(PluginCall call) {
        String filePath = call.getString("filePath");
        Context context = getContext();

        File apkFile;
        if (filePath != null && !filePath.trim().isEmpty()) {
            apkFile = new File(filePath);
        } else {
            apkFile = getUpdateApkFile();
        }

        if (!apkFile.exists() || apkFile.length() <= 0) {
            call.reject("APK file does not exist. Please download update first.");
            return;
        }

        // 1. Full Pre-Install Verification Check
        JSObject verification = performApkVerification(apkFile.getAbsolutePath());
        if (!verification.optBoolean("isValid", false)) {
            String reason = verification.optString("errorReason", "UNKNOWN_VERIFICATION_FAILURE");
            String message = verification.optString("errorMessage", "Downloaded APK इस app के compatible update के रूप में verify नहीं हुआ।");
            JSObject rejectData = new JSObject();
            rejectData.put("errorReason", reason);
            rejectData.put("errorMessage", message);
            call.reject(message, rejectData);
            return;
        }

        // 2. Check Unknown App Install Permission on Android 8.0+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!context.getPackageManager().canRequestPackageInstalls()) {
                JSObject ret = new JSObject();
                ret.put("permissionRequired", true);
                ret.put("message", "Unknown sources permission required to install updates");
                call.resolve(ret);
                return;
            }
        }

        // 3. Launch Android Package Installer via Secure FileProvider
        try {
            Uri apkUri = FileProvider.getUriForFile(
                context,
                context.getPackageName() + ".fileprovider",
                apkFile
            );

            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            installIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);

            context.startActivity(installIntent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "Official Android APK installation flow initiated.");
            ret.put("targetVersionCode", verification.optLong("apkVersionCode", 200));
            ret.put("targetVersionName", verification.optString("apkVersionName", "2.0.0"));
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch package installer", e);
            call.reject("Failed to trigger Android installation: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void deleteDownloadedApk(PluginCall call) {
        try {
            File apkFile = getUpdateApkFile();
            boolean deleted = false;
            if (apkFile.exists()) {
                deleted = apkFile.delete();
            }
            call.resolve(new JSObject().put("success", true).put("deleted", deleted));
        } catch (Exception e) {
            call.reject("Failed to delete APK: " + e.getMessage(), e);
        }
    }

    private File getUpdateApkFile() {
        Context context = getContext();
        File dir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (dir == null) {
            dir = new File(context.getCacheDir(), "updates");
        }
        if (!dir.exists()) {
            dir.mkdirs();
        }
        return new File(dir, "sk_mission_board_v2.0.0.apk");
    }
}
