#pragma once

#include <pebble.h>

#define MAX_MENU_ITEMS 20
#define TEXT_SHORT 24
#define TEXT_MEDIUM 32
#define TEXT_LONG 96

typedef enum {
  SCREEN_LOADING,
  SCREEN_DASHBOARD,
  SCREEN_PIN,
  SCREEN_ERROR,
} AppScreen;

typedef enum {
  MENU_KIND_MAIN,
  MENU_KIND_LIST,
} MenuKind;

typedef struct {
  char title[TEXT_MEDIUM];
  char subtitle[TEXT_MEDIUM];
  char value[TEXT_SHORT];
} HiveMenuItem;

typedef struct {
  char name[TEXT_MEDIUM];
  char temperature[TEXT_SHORT];
  char humidity[TEXT_SHORT];
  char desired_temperature[TEXT_MEDIUM];
  char heat_hold[TEXT_SHORT];
  char cool_hold[TEXT_SHORT];
  char mode_color[TEXT_SHORT];
  char status[TEXT_MEDIUM];
  bool hold;
  bool has_hold;
  bool has_sensors;
  int thermostat_count;
} DashboardState;

extern Layer *s_main_layer;
extern Window *s_menu_window;
extern MenuLayer *s_menu_layer;
extern bool s_menu_visible;
extern AppScreen s_screen;
extern DashboardState s_dashboard;
extern HiveMenuItem s_menu_items[MAX_MENU_ITEMS];
extern int s_menu_item_count;
extern MenuKind s_menu_kind;
extern char s_menu_title[TEXT_MEDIUM];
extern char s_list_action[TEXT_SHORT];
extern char s_title[TEXT_MEDIUM];
extern char s_body[TEXT_LONG];
extern char s_pin[TEXT_SHORT];
extern char s_error[TEXT_LONG];
extern bool s_phone_ready;
extern bool s_busy;
extern int32_t s_request_id;

GColor hive_black(void);
GColor hive_white(void);
GColor hive_panel(void);
GColor hive_menu_bg(void);
GColor hive_highlight(void);
GColor hive_heat(void);
GColor hive_cool(void);

void copy_text(char *dest, size_t dest_size, const char *source);
void copy_tuple_string(DictionaryIterator *iter, uint32_t key, char *dest, size_t dest_size);
int32_t tuple_int(DictionaryIterator *iter, uint32_t key, int32_t fallback);
bool tuple_bool(DictionaryIterator *iter, uint32_t key);
uint32_t item_title_key(int index);
uint32_t item_subtitle_key(int index);
uint32_t item_value_key(int index);

void set_screen(AppScreen screen);
void set_error(const char *message);

bool send_command(const char *command, const char *action, const char *value, int32_t delta,
                  int32_t index, bool include_delta, bool include_index);
void request_initial_state(void);
void app_message_init(void);

void main_layer_update_proc(Layer *layer, GContext *ctx);
void draw_pin_screen(GContext *ctx, GRect bounds);

void build_main_menu(void);
void show_menu(void);
void hide_menu(void);
