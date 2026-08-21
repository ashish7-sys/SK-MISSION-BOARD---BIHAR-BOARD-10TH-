package com.skmissionboard.app;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

@CapacitorPlugin(name = "AppUpdatePlugin")
public class AppUpdatePlugin extends Plugin {

    @PluginMethod
    public void getInstalledVersion(PluginCall call) {
        try {
            Context context = getContext();
            PackageInfo pInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            long versionCode;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                versionCode = pInfo.getLongVersionCode();
            } else {
                versionCode = pInfo.versionCode;
            }

            JSObject ret = new JSObject();
            ret.put("versionCode", versionCode);
            ret.put("versionName", pInfo.versionName);
            ret.put("packageName", context.getPackageName());
            ret.put("isNativeAndroid", true);
            call.resolve(ret);
        } catch (Exception e) {
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
    public void installApk(PluginCall call) {
        String filePath = call.getString("filePath");
        if (filePath == null || filePath.trim().isEmpty()) {
            call.reject("APK file path is required");
            return;
        }

        try {
            Context context = getContext();
            File apkFile = new File(filePath);

            if (!apkFile.exists()) {
                call.reject("APK file does not exist at path: " + filePath);
                return;
            }

            if (!apkFile.getName().toLowerCase().endsWith(".apk")) {
                call.reject("Downloaded file is not a valid Android APK package");
                return;
            }

            // Check unknown sources permission on Android 8.0+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!context.getPackageManager().canRequestPackageInstalls()) {
                    JSObject ret = new JSObject();
                    ret.put("permissionRequired", true);
                    ret.put("message", "Unknown sources permission required");
                    call.resolve(ret);
                    return;
                }
            }

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
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to trigger APK installation: " + e.getMessage(), e);
        }
    }
}
