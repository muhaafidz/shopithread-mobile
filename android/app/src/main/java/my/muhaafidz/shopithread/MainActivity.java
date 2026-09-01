package my.muhaafidz.shopithread;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(ScraperPlugin.class);
        ScraperPluginHolder.set((ScraperPlugin) bridge.getPlugin("Scraper").getInstance());
    }
}
