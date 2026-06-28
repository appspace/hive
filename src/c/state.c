#include "hive.h"

Layer *s_main_layer;
Window *s_menu_window;
MenuLayer *s_menu_layer;
bool s_menu_visible;
GFont s_current_temperature_font;
static bool s_pin_backlight_enabled;

AppScreen s_screen = SCREEN_LOADING;
DashboardState s_dashboard;
HiveMenuItem s_menu_items[MAX_MENU_ITEMS];
int s_menu_item_count;
MenuKind s_menu_kind = MENU_KIND_MAIN;
char s_menu_title[TEXT_MEDIUM] = "Hive";
char s_list_action[TEXT_SHORT];

char s_title[TEXT_MEDIUM] = "Hive";
char s_body[TEXT_LONG] = "Connecting...";
char s_pin[TEXT_SHORT];
char s_error[TEXT_LONG];

bool s_phone_ready;
bool s_busy;
int32_t s_request_id = 1;
int32_t s_pending_request_id;
int32_t s_latest_response_request_id;

void set_screen(AppScreen screen) {
  bool should_enable_pin_backlight = screen == SCREEN_PIN;
  if (should_enable_pin_backlight != s_pin_backlight_enabled) {
    light_enable(should_enable_pin_backlight);
    if (!should_enable_pin_backlight) {
      light_enable_interaction();
    }
    s_pin_backlight_enabled = should_enable_pin_backlight;
  }

  s_screen = screen;
  if (s_main_layer) {
    layer_mark_dirty(s_main_layer);
  }
}

void set_error(const char *message) {
  copy_text(s_error, sizeof(s_error), message && message[0] ? message : "Unknown error");
  set_screen(SCREEN_ERROR);
}
