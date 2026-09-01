package my.muhaafidz.shopithread;

public final class ScraperPluginHolder {
    private static volatile ScraperPlugin plugin;

    public static void set(ScraperPlugin p) {
        plugin = p;
    }

    public static ScraperPlugin get() {
        return plugin;
    }
}
