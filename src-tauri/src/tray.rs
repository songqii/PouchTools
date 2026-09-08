use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager, WindowEvent,
};

fn show_main_window(app: &AppHandle) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("main") {
        #[cfg(target_os = "macos")]
        app.set_activation_policy(tauri::ActivationPolicy::Regular)?;
        window.unminimize()?;
        window.show()?;
        window.set_focus()?;
    }
    Ok(())
}

pub fn setup(app: &mut tauri::App) -> tauri::Result<()> {
    let show = MenuItem::with_id(
        app,
        "tray-show",
        "显示主窗口 / Show window",
        true,
        None::<&str>,
    )?;
    let quit = MenuItem::with_id(app, "tray-quit", "退出 / Quit", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let menu = Menu::with_items(app, &[&show, &separator, &quit])?;

    // A separate monochrome icon stays legible in the macOS menu bar.
    TrayIconBuilder::with_id("pouchtools-tray")
        .icon(tauri::include_image!("icons/tray.png"))
        .icon_as_template(true)
        .tooltip("PouchTools")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "tray-show" => {
                if let Err(error) = show_main_window(app) {
                    eprintln!("Unable to show PouchTools: {error}");
                }
            }
            // Explicit quit exits the process; it doesn't invoke window.close().
            "tray-quit" => app.exit(0),
            _ => {}
        })
        .build(app)?;

    // Install the close handler only once the tray is available for restoration.
    if let Some(window) = app.get_webview_window("main") {
        let main_window = window.clone();
        window.on_window_event(move |event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                if let Err(error) = main_window.hide() {
                    eprintln!("Unable to hide PouchTools: {error}");
                    return;
                }
                #[cfg(target_os = "macos")]
                if let Err(error) = main_window
                    .app_handle()
                    .set_activation_policy(tauri::ActivationPolicy::Accessory)
                {
                    eprintln!("Unable to hide PouchTools from the Dock: {error}");
                }
            }
        });
    }
    Ok(())
}
