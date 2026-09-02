package my.muhaafidz.shopithread;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginHandle;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ScraperPlugin.class);
        super.onCreate(savedInstanceState);
        ScraperPluginHolder.set(scraperPlugin());
    }

    private ScraperPlugin scraperPlugin() {
        if (bridge == null) return null;
        PluginHandle handle = bridge.getPlugin("Scraper");
        return handle == null ? null : (ScraperPlugin) handle.getInstance();
    }
}
