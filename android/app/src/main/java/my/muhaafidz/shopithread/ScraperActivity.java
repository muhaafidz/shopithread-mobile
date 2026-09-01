package my.muhaafidz.shopithread;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

public class ScraperActivity extends AppCompatActivity {

    public static final String DESKTOP_UA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

    private static final String[] ALLOWED_HOST_SUFFIXES = {
            "shopee.com.my", "s.shopee.com.my", "shopee.com"
    };

    private static volatile String resultJson;
    public static volatile int scrapeMaxPages = 1;
    public static volatile int scrapeDelayMs = 600;

    private WebView webView;
    private TextView statusText;
    private boolean scraperInjected = false;

    static String consumeResult() {
        String json = resultJson;
        resultJson = null;
        return json;
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        int maxPages = getIntent().getIntExtra("maxPages", 1);
        int delayMs = getIntent().getIntExtra("delayMs", 600);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor("#070b14"));

        statusText = new TextView(this);
        statusText.setTextColor(Color.WHITE);
        statusText.setTextSize(13);
        statusText.setPadding(28, 20, 28, 20);
        statusText.setBackgroundColor(Color.parseColor("#0b1120"));
        statusText.setText("Loading Shopee Affiliate portal… log in if needed, then tap ▶");
        root.addView(statusText);

        webView = new WebView(this);
        webView.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.MATCH_PARENT));
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setUserAgentString(DESKTOP_UA);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(false);
        webView.getSettings().setJavaScriptCanOpenWindowsAutomatically(true);
        webView.getSettings().setSupportMultipleWindows(true);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !isAllowedUrl(request.getUrl().toString());
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (isAllowedUrl(url)) {
                    injectScraper();
                }
            }
        });
        webView.addJavascriptInterface(new Bridge(), "AndroidBridge");
        root.addView(webView);
        setContentView(root);

        webView.loadUrl("https://affiliate.shopee.com.my/offer/product_offer");
        scrapeMaxPages = maxPages;
        scrapeDelayMs = delayMs;
    }

    private boolean isAllowedUrl(String url) {
        if (url == null || !url.startsWith("https://")) return false;
        for (String suffix : ALLOWED_HOST_SUFFIXES) {
            String host = android.net.Uri.parse(url).getHost();
            if (host != null && (host.equals(suffix) || host.endsWith("." + suffix))) return true;
        }
        return false;
    }

    private void injectScraper() {
        if (scraperInjected) return;
        try {
            String js = new BufferedReader(new InputStreamReader(
                    getAssets().open("scraper.js"), StandardCharsets.UTF_8))
                    .lines().collect(Collectors.joining("\n"));
            webView.evaluateJavascript(js, null);
            scraperInjected = true;
        } catch (Exception e) {
            Toast.makeText(this, "Failed to inject scraper: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private class Bridge {
        @JavascriptInterface
        public void progress(final String json) {
            runOnUiThread(() -> {
                try {
                    org.json.JSONObject o = new org.json.JSONObject(json);
                    statusText.setText(o.optString("text", ""));
                    ScraperPlugin plugin = ScraperPluginHolder.get();
                    if (plugin != null) plugin.emitProgress(o.optString("text", ""), o.optInt("pct", 0));
                } catch (Exception ignored) {
                }
            });
        }

        @JavascriptInterface
        public void done(final String json) {
            resultJson = json;
            runOnUiThread(() -> {
                Toast.makeText(ScraperActivity.this, "Scrape finished — saving…", Toast.LENGTH_SHORT).show();
                setResult(Activity.RESULT_OK);
                finish();
            });
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
