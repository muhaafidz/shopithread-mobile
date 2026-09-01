package my.muhaafidz.shopithread;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Scraper")
public class ScraperPlugin extends Plugin {

    private PluginCall pendingCall;

    @PluginMethod
    public void openScraper(PluginCall call) {
        if (pendingCall != null) {
            call.reject("Scraper is already running");
            return;
        }
        Integer maxPages = call.getInt("maxPages", 1);
        Integer delayMs = call.getInt("delayMs", 600);
        pendingCall = call;

        Intent intent = new Intent(getContext(), ScraperActivity.class);
        intent.putExtra("maxPages", maxPages == null ? 1 : maxPages);
        intent.putExtra("delayMs", delayMs == null ? 600 : delayMs);
        startActivityForResult(call, intent, "scrapeFinished");
    }

    @ActivityCallback
    private void scrapeFinished(PluginCall call, android.content.Intent result) {
        pendingCall = null;
        String json = ScraperActivity.consumeResult();
        if (call == null) return;
        if (json == null || json.isEmpty()) {
            call.resolve(new JSObject().put("count", 0).put("cancelled", true));
            return;
        }
        try {
            JSObject out = new JSObject(json);
            call.resolve(out);
        } catch (Exception e) {
            call.reject("Failed to parse scraper result: " + e.getMessage());
        }
    }

    void emitProgress(String text, int pct) {
        JSObject data = new JSObject();
        data.put("text", text);
        data.put("pct", pct);
        notifyListeners("progress", data);
    }
}
