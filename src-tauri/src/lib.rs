use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    if let Err(error) = window.set_decorations(false) {
                        eprintln!("Unable to disable native window decorations: {error}");
                    }
                    #[cfg(any(target_os = "macos", target_os = "windows"))]
                    if let Err(error) = window.set_shadow(false) {
                        eprintln!("Unable to disable native window shadow: {error}");
                    }
                }
                tray::setup(app)?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running PouchTools");
}
#[cfg(desktop)]
mod tray;
