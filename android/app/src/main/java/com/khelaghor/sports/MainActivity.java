package com.khelaghor.sports;

import android.annotation.SuppressLint;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView myWebView;
    private static final String APP_URL = "https://livekhela.site";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Hide notification bar to run full screen and immersive
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        );

        myWebView = findViewById(R.id.webview);
        WebSettings webSettings = myWebView.getSettings();

        // 1. Enable Javascript, DOM Storage, and App Cache to make sure web layouts and scripts execute
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        
        // 2. Enable autoplay on live m3u8 streams without requiring explicit clicks
        webSettings.setMediaPlaybackRequiresUserGesture(false);

        // 3. Bypass Mixed Content filters - lets HTTP custom live channels stream inside HTTPS site
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        // 4. Override Custom User-Agent to act like standard Google Chrome on Android.
        // This is a CRITICAL setting: many premium sports providers (like tsports, asimxtech) block requests
        // containing "wv" or "Version/4.0" (WebView signatures) but allow clean Chrome mobile requests.
        // We append KhelaghorAndroidApp/1.0 so our web telemetry can count users using the App specifically!
        String chromeUA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 KhelaghorAndroidApp/1.0";
        webSettings.setUserAgentString(chromeUA);

        // Keep navigation inside WebView
        myWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });

        // Enable video playing support
        myWebView.setWebChromeClient(new WebChromeClient());

        // Load KhelaGhor Live platform
        myWebView.loadUrl(APP_URL);
    }

    @Override
    public void onBackPressed() {
        if (myWebView.canGoBack()) {
            myWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
