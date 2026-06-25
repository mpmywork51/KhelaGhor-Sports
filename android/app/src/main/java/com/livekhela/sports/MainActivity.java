package com.livekhela.sports;

import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
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
        
        // Ensure WebView doesn't show a white background or flash white during loading
        myWebView.setBackgroundColor(android.graphics.Color.parseColor("#09090b"));
        
        // 1. Force Full Hardware-Accelerated Rendering at the WebView layer
        myWebView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        WebSettings webSettings = myWebView.getSettings();

        // 2. Enable Javascript, DOM Storage, and App Cache to make sure web layouts and scripts execute
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
        
        // 3. Optimize WebView Caching to handle high-traffic streaming chunks dynamically
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        
        // 4. Enable autoplay on live m3u8 streams without requiring explicit clicks
        webSettings.setMediaPlaybackRequiresUserGesture(false);

        // 5. Enable standard cookies and third-party cookies for HLS segments/CDNs authentication
        CookieManager.getInstance().setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            CookieManager.getInstance().setAcceptThirdPartyCookies(myWebView, true);
        }

        // 6. Override Custom User-Agent to act like standard Google Chrome on Android.
        // This is a CRITICAL setting: many premium sports providers (like tsports, asimxtech) block requests
        // containing "wv" or "Version/4.0" (WebView signatures) but allow clean Chrome mobile requests.
        // We append LiveKhelaAndroidApp/1.0 so our web telemetry can count users using the App specifically!
        String chromeUA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 LiveKhelaAndroidApp/1.0";
        webSettings.setUserAgentString(chromeUA);

        // Keep navigation inside WebView and handle SSL / background
        myWebView.setWebViewClient(new WebViewClient() {
            @SuppressWarnings("deprecation")
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    view.loadUrl(url);
                    return false; // let webview handle it
                }
                return true; // prevent loading other schemes
            }

            @TargetApi(Build.VERSION_CODES.N)
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    view.loadUrl(url);
                    return false; // let webview handle it
                }
                return true; // prevent loading other schemes
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                // Ignore SSL certificate errors to prevent blank screen for test/dev domains or CDN node issues
                handler.proceed();
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                view.setBackgroundColor(android.graphics.Color.parseColor("#09090b"));
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                view.setBackgroundColor(android.graphics.Color.parseColor("#09090b"));
            }
        });

        // Enable video playing support
        myWebView.setWebChromeClient(new WebChromeClient());

        // Load LiveKhela Live platform
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
