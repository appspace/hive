#include "hive.h"

static Window *s_main_window;

static void select_click_handler(ClickRecognizerRef recognizer, void *context) {
  if (s_busy) {
    return;
  }
  if (s_screen == SCREEN_DASHBOARD) {
    build_main_menu();
    show_menu();
  } else if (s_screen == SCREEN_PIN) {
    send_command("AUTHORIZE_PIN", NULL, NULL, 0, 0, false, false);
  } else if (s_screen == SCREEN_ERROR) {
    send_command("REFRESH", NULL, NULL, 0, 0, false, false);
  }
}

static void up_click_handler(ClickRecognizerRef recognizer, void *context) {
  if (!s_busy && s_screen == SCREEN_DASHBOARD) {
    send_command("ADJUST", NULL, NULL, 10, 0, true, false);
  }
}

static void down_click_handler(ClickRecognizerRef recognizer, void *context) {
  if (!s_busy && s_screen == SCREEN_DASHBOARD) {
    send_command("ADJUST", NULL, NULL, -10, 0, true, false);
  }
}

static void click_config_provider(void *context) {
  window_single_click_subscribe(BUTTON_ID_SELECT, select_click_handler);
  window_single_click_subscribe(BUTTON_ID_UP, up_click_handler);
  window_single_click_subscribe(BUTTON_ID_DOWN, down_click_handler);
}

static void main_window_load(Window *window) {
  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(window_layer);
  s_main_layer = layer_create(bounds);
  layer_set_update_proc(s_main_layer, main_layer_update_proc);
  layer_add_child(window_layer, s_main_layer);
}

static void main_window_unload(Window *window) {
  layer_destroy(s_main_layer);
  s_main_layer = NULL;
}

static void init(void) {
  copy_text(s_dashboard.name, sizeof(s_dashboard.name), "Hive");
  copy_text(s_title, sizeof(s_title), "Hive");
  copy_text(s_body, sizeof(s_body), "Connecting...");
#ifdef PBL_PLATFORM_FLINT
  s_current_temperature_font =
    fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FONT_ROBOTO_MONO_BOLD_54));
#else
  s_current_temperature_font =
    fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FONT_ROBOTO_MONO_BOLD_64));
#endif

  s_main_window = window_create();
  window_set_background_color(s_main_window, hive_black());
  window_set_click_config_provider(s_main_window, click_config_provider);
  window_set_window_handlers(s_main_window,
                             (WindowHandlers){
                               .load = main_window_load,
                               .unload = main_window_unload,
                             });
  window_stack_push(s_main_window, true);

  app_message_init();
}

static void deinit(void) {
  light_enable(false);
  light_enable_interaction();
  if (s_current_temperature_font) {
    fonts_unload_custom_font(s_current_temperature_font);
    s_current_temperature_font = NULL;
  }
  if (s_menu_window) {
    window_destroy(s_menu_window);
  }
  window_destroy(s_main_window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}
