#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(desktop)]
            tray::setup(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running PouchTools");
}
#[cfg(desktop)]
mod tray;
