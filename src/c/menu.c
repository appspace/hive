#include "hive.h"

static void add_menu_item(const char *title, const char *subtitle, const char *value) {
  if (s_menu_item_count >= MAX_MENU_ITEMS) {
    return;
  }
  copy_text(s_menu_items[s_menu_item_count].title, sizeof(s_menu_items[s_menu_item_count].title),
            title);
  copy_text(s_menu_items[s_menu_item_count].subtitle,
            sizeof(s_menu_items[s_menu_item_count].subtitle), subtitle);
  copy_text(s_menu_items[s_menu_item_count].value, sizeof(s_menu_items[s_menu_item_count].value),
            value);
  s_menu_item_count++;
}

void build_main_menu(void) {
  s_menu_kind = MENU_KIND_MAIN;
  copy_text(s_menu_title, sizeof(s_menu_title), "Hive");
  copy_text(s_list_action, sizeof(s_list_action), "");
  s_menu_item_count = 0;

  if (s_dashboard.has_hold) {
    add_menu_item("Resume Program", NULL, "RESUME");
  }
  add_menu_item("Home and Hold", NULL, "HOME");
  add_menu_item("Away and Hold", NULL, "AWAY");
  add_menu_item("Sleep and Hold", NULL, "SLEEP");
  add_menu_item("Change Mode", NULL, "MODES");
  if (s_dashboard.has_sensors) {
    add_menu_item("Sensors", NULL, "SENSORS");
  }
  if (s_dashboard.thermostat_count > 1) {
    add_menu_item("Thermostats", NULL, "THERMOSTATS");
  }
}

static uint16_t menu_get_num_sections_callback(MenuLayer *menu_layer, void *context) {
  return 1;
}

static uint16_t menu_get_num_rows_callback(MenuLayer *menu_layer, uint16_t section_index,
                                           void *context) {
  return s_menu_item_count;
}

static int16_t menu_get_cell_height_callback(MenuLayer *menu_layer, MenuIndex *cell_index,
                                             void *context) {
  if (cell_index->row >= (uint16_t)s_menu_item_count) {
    return 34;
  }

  HiveMenuItem *item = &s_menu_items[cell_index->row];
  return item->subtitle[0] ? 44 : 34;
}

static int16_t menu_get_header_height_callback(MenuLayer *menu_layer, uint16_t section_index,
                                               void *context) {
  if (s_menu_kind == MENU_KIND_MAIN) {
    return 0;
  }

  return 34;
}

static void menu_draw_header_callback(GContext *ctx, const Layer *cell_layer,
                                      uint16_t section_index, void *context) {
  if (s_menu_kind == MENU_KIND_MAIN) {
    return;
  }

  GRect bounds = layer_get_bounds(cell_layer);
  graphics_context_set_fill_color(ctx, hive_black());
  graphics_fill_rect(ctx, bounds, 0, GCornerNone);
  graphics_context_set_text_color(ctx, hive_white());
  graphics_draw_text(ctx, s_menu_title, fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD),
                     GRect(6, 3, bounds.size.w - 12, 28), GTextOverflowModeTrailingEllipsis,
                     PBL_IF_ROUND_ELSE(GTextAlignmentCenter, GTextAlignmentLeft), NULL);
}

#if defined(PBL_ROUND)
static void draw_centered_menu_row(GContext *ctx, const Layer *cell_layer, HiveMenuItem *item) {
  GRect bounds = layer_get_bounds(cell_layer);
  bool highlighted = menu_cell_layer_is_highlighted(cell_layer);
  GColor bg_color = highlighted ? hive_black() : hive_menu_bg();
  GColor text_color = hive_white();

  graphics_context_set_fill_color(ctx, bg_color);
  graphics_fill_rect(ctx, bounds, 0, GCornerNone);
  graphics_context_set_text_color(ctx, text_color);

  if (item->subtitle[0]) {
    graphics_draw_text(ctx, item->title, fonts_get_system_font(FONT_KEY_GOTHIC_24),
                       GRect(8, 1, bounds.size.w - 16, 25), GTextOverflowModeTrailingEllipsis,
                       GTextAlignmentCenter, NULL);
    graphics_draw_text(ctx, item->subtitle, fonts_get_system_font(FONT_KEY_GOTHIC_18),
                       GRect(8, 24, bounds.size.w - 16, 19), GTextOverflowModeTrailingEllipsis,
                       GTextAlignmentCenter, NULL);
  } else {
    graphics_draw_text(ctx, item->title, fonts_get_system_font(FONT_KEY_GOTHIC_28),
                       GRect(8, 0, bounds.size.w - 16, bounds.size.h),
                       GTextOverflowModeTrailingEllipsis, GTextAlignmentCenter, NULL);
  }
}
#elif defined(PBL_PLATFORM_FLINT)

static void draw_flint_menu_row(GContext *ctx, const Layer *cell_layer, HiveMenuItem *item) {
  GRect bounds = layer_get_bounds(cell_layer);
  bool highlighted = menu_cell_layer_is_highlighted(cell_layer);
  GColor bg_color = highlighted ? hive_black() : hive_menu_bg();
  GColor text_color = hive_white();

  graphics_context_set_fill_color(ctx, bg_color);
  graphics_fill_rect(ctx, bounds, 0, GCornerNone);
  graphics_context_set_text_color(ctx, text_color);

  if (item->subtitle[0]) {
    graphics_draw_text(ctx, item->title, fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD),
                       GRect(6, 2, bounds.size.w - 12, 20), GTextOverflowModeTrailingEllipsis,
                       GTextAlignmentLeft, NULL);
    graphics_draw_text(ctx, item->subtitle, fonts_get_system_font(FONT_KEY_GOTHIC_14),
                       GRect(6, 22, bounds.size.w - 12, 17), GTextOverflowModeTrailingEllipsis,
                       GTextAlignmentLeft, NULL);
  } else {
    graphics_draw_text(ctx, item->title, fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD),
                       GRect(6, 2, bounds.size.w - 12, bounds.size.h - 2),
                       GTextOverflowModeTrailingEllipsis, GTextAlignmentLeft, NULL);
  }
}
#endif

static void menu_draw_row_callback(GContext *ctx, const Layer *cell_layer, MenuIndex *cell_index,
                                   void *context) {
  if (cell_index->row >= (uint16_t)s_menu_item_count) {
    return;
  }

  HiveMenuItem *item = &s_menu_items[cell_index->row];
#if defined(PBL_ROUND)
  draw_centered_menu_row(ctx, cell_layer, item);
#elif defined(PBL_PLATFORM_FLINT)
  draw_flint_menu_row(ctx, cell_layer, item);
#else
  if (item->subtitle[0]) {
    menu_cell_basic_draw(ctx, cell_layer, item->title, item->subtitle, NULL);
  } else {
    menu_cell_title_draw(ctx, cell_layer, item->title);
  }
#endif
}

static void menu_select_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *context) {
  if (cell_index->row >= (uint16_t)s_menu_item_count) {
    return;
  }
  HiveMenuItem *item = &s_menu_items[cell_index->row];

  if (s_menu_kind == MENU_KIND_MAIN) {
    if (strcmp(item->value, "SENSORS") == 0 || strcmp(item->value, "THERMOSTATS") == 0 ||
        strcmp(item->value, "MODES") == 0) {
      send_command("LIST", item->value, NULL, 0, 0, false, false);
    } else {
      send_command("ACTION", item->value, NULL, 0, 0, false, false);
    }
  } else if (strcmp(s_list_action, "SELECT_THERMOSTAT") == 0) {
    send_command("SELECT_THERMOSTAT", NULL, NULL, 0, cell_index->row, false, true);
  } else if (strcmp(s_list_action, "SET_MODE") == 0) {
    send_command("SET_MODE", NULL, item->value, 0, 0, false, false);
  }
}

static void menu_back_click_handler(ClickRecognizerRef recognizer, void *context) {
  reset_inactivity_timer();
  if (s_menu_kind == MENU_KIND_LIST) {
    build_main_menu();
    menu_layer_reload_data(s_menu_layer);
    menu_layer_set_selected_index(s_menu_layer, MenuIndex(0, 0), MenuRowAlignCenter, false);
    return;
  }

  window_stack_pop(true);
}

static void menu_up_click_handler(ClickRecognizerRef recognizer, void *context) {
  reset_inactivity_timer();
  menu_layer_set_selected_next(s_menu_layer, true, MenuRowAlignCenter, true);
}

static void menu_down_click_handler(ClickRecognizerRef recognizer, void *context) {
  reset_inactivity_timer();
  menu_layer_set_selected_next(s_menu_layer, false, MenuRowAlignCenter, true);
}

static void menu_select_click_handler(ClickRecognizerRef recognizer, void *context) {
  reset_inactivity_timer();
  MenuIndex selected = menu_layer_get_selected_index(s_menu_layer);
  menu_select_callback(s_menu_layer, &selected, NULL);
}

static void menu_click_config_provider(void *context) {
  window_single_click_subscribe(BUTTON_ID_UP, menu_up_click_handler);
  window_single_click_subscribe(BUTTON_ID_DOWN, menu_down_click_handler);
  window_single_click_subscribe(BUTTON_ID_SELECT, menu_select_click_handler);
  window_single_click_subscribe(BUTTON_ID_BACK, menu_back_click_handler);
}

static MenuLayerCallbacks s_menu_callbacks = {
  .get_num_sections = menu_get_num_sections_callback,
  .get_num_rows = menu_get_num_rows_callback,
  .get_cell_height = menu_get_cell_height_callback,
  .get_header_height = menu_get_header_height_callback,
  .draw_header = menu_draw_header_callback,
  .draw_row = menu_draw_row_callback,
  .select_click = menu_select_callback,
};

static void menu_window_load(Window *window) {
  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(window_layer);
  s_menu_layer = menu_layer_create(bounds);
  menu_layer_set_callbacks(s_menu_layer, NULL, s_menu_callbacks);
  window_set_click_config_provider(window, menu_click_config_provider);
  menu_layer_set_normal_colors(s_menu_layer, hive_menu_bg(), hive_white());
  menu_layer_set_highlight_colors(s_menu_layer, hive_black(), hive_white());
  layer_add_child(window_layer, menu_layer_get_layer(s_menu_layer));
}

static void menu_window_unload(Window *window) {
  menu_layer_destroy(s_menu_layer);
  s_menu_layer = NULL;
  s_menu_visible = false;
}

void show_menu(void) {
  if (!s_menu_window) {
    s_menu_window = window_create();
    window_set_window_handlers(s_menu_window,
                               (WindowHandlers){
                                 .load = menu_window_load,
                                 .unload = menu_window_unload,
                               });
  }

  if (!s_menu_visible) {
    s_menu_visible = true;
    window_stack_push(s_menu_window, true);
  } else if (s_menu_layer) {
    menu_layer_reload_data(s_menu_layer);
    menu_layer_set_selected_index(s_menu_layer, MenuIndex(0, 0), MenuRowAlignCenter, false);
  }
}

void hide_menu(void) {
  if (s_menu_visible && s_menu_window) {
    window_stack_remove(s_menu_window, false);
    s_menu_visible = false;
  }
}
