#include "hive.h"

bool send_command(const char *command, const char *action, const char *value, int32_t delta,
                  int32_t index, bool include_delta, bool include_index) {
  if (!s_phone_ready || s_busy) {
    return false;
  }

  DictionaryIterator *iter;
  AppMessageResult result = app_message_outbox_begin(&iter);
  if (result != APP_MSG_OK || !iter) {
    APP_LOG(APP_LOG_LEVEL_WARNING, "outbox begin failed: %d", result);
    return false;
  }

  dict_write_cstring(iter, MESSAGE_KEY_COMMAND, command);
  dict_write_int32(iter, MESSAGE_KEY_REQUEST_ID, s_request_id++);
  if (include_delta) {
    dict_write_int32(iter, MESSAGE_KEY_DELTA, delta);
  }
  if (action) {
    dict_write_cstring(iter, MESSAGE_KEY_ACTION, action);
  }
  if (value) {
    dict_write_cstring(iter, MESSAGE_KEY_VALUE, value);
  }
  if (include_index) {
    dict_write_int32(iter, MESSAGE_KEY_INDEX, index);
  }

  dict_write_end(iter);
  result = app_message_outbox_send();
  if (result != APP_MSG_OK) {
    APP_LOG(APP_LOG_LEVEL_WARNING, "outbox send failed: %d", result);
    return false;
  }

  s_busy = true;
  return true;
}

void request_initial_state(void) {
  if (s_phone_ready) {
    send_command("INIT", NULL, NULL, 0, 0, false, false);
  }
}

static void parse_dashboard(DictionaryIterator *iter) {
  copy_tuple_string(iter, MESSAGE_KEY_NAME, s_dashboard.name, sizeof(s_dashboard.name));
  copy_tuple_string(iter, MESSAGE_KEY_TEMPERATURE, s_dashboard.temperature,
                    sizeof(s_dashboard.temperature));
  copy_tuple_string(iter, MESSAGE_KEY_HUMIDITY, s_dashboard.humidity, sizeof(s_dashboard.humidity));
  copy_tuple_string(iter, MESSAGE_KEY_DESIRED_TEMPERATURE, s_dashboard.desired_temperature,
                    sizeof(s_dashboard.desired_temperature));
  copy_tuple_string(iter, MESSAGE_KEY_HEAT_HOLD, s_dashboard.heat_hold,
                    sizeof(s_dashboard.heat_hold));
  copy_tuple_string(iter, MESSAGE_KEY_COOL_HOLD, s_dashboard.cool_hold,
                    sizeof(s_dashboard.cool_hold));
  copy_tuple_string(iter, MESSAGE_KEY_MODE_COLOR, s_dashboard.mode_color,
                    sizeof(s_dashboard.mode_color));
  copy_tuple_string(iter, MESSAGE_KEY_STATUS, s_dashboard.status, sizeof(s_dashboard.status));
  s_dashboard.hold = tuple_bool(iter, MESSAGE_KEY_HOLD);
  s_dashboard.has_hold = tuple_bool(iter, MESSAGE_KEY_HAS_HOLD);
  s_dashboard.has_sensors = tuple_bool(iter, MESSAGE_KEY_HAS_SENSORS);
  s_dashboard.thermostat_count = tuple_int(iter, MESSAGE_KEY_THERMOSTAT_COUNT, 0);
}

static void parse_list(DictionaryIterator *iter) {
  s_menu_kind = MENU_KIND_LIST;
  copy_tuple_string(iter, MESSAGE_KEY_LIST_TITLE, s_menu_title, sizeof(s_menu_title));
  copy_tuple_string(iter, MESSAGE_KEY_LIST_ACTION, s_list_action, sizeof(s_list_action));
  s_menu_item_count = tuple_int(iter, MESSAGE_KEY_LIST_COUNT, 0);
  if (s_menu_item_count > MAX_MENU_ITEMS) {
    s_menu_item_count = MAX_MENU_ITEMS;
  }

  for (int i = 0; i < s_menu_item_count; i++) {
    copy_text(s_menu_items[i].title, sizeof(s_menu_items[i].title), "");
    copy_text(s_menu_items[i].subtitle, sizeof(s_menu_items[i].subtitle), "");
    copy_text(s_menu_items[i].value, sizeof(s_menu_items[i].value), "");
    copy_tuple_string(iter, item_title_key(i), s_menu_items[i].title,
                      sizeof(s_menu_items[i].title));
    copy_tuple_string(iter, item_subtitle_key(i), s_menu_items[i].subtitle,
                      sizeof(s_menu_items[i].subtitle));
    copy_tuple_string(iter, item_value_key(i), s_menu_items[i].value,
                      sizeof(s_menu_items[i].value));
  }
}

static void inbox_received_callback(DictionaryIterator *iter, void *context) {
  s_busy = false;

  if (dict_find(iter, MESSAGE_KEY_READY)) {
    s_phone_ready = true;
    request_initial_state();
  }

  Tuple *error_tuple = dict_find(iter, MESSAGE_KEY_ERROR);
  if (error_tuple && error_tuple->type == TUPLE_CSTRING) {
    set_error(error_tuple->value->cstring);
    return;
  }

  Tuple *screen_tuple = dict_find(iter, MESSAGE_KEY_SCREEN);
  if (!screen_tuple || screen_tuple->type != TUPLE_CSTRING) {
    return;
  }

  const char *screen = screen_tuple->value->cstring;
  if (strcmp(screen, "dashboard") == 0) {
    parse_dashboard(iter);
    hide_menu();
    set_screen(SCREEN_DASHBOARD);
  } else if (strcmp(screen, "pin") == 0) {
    copy_tuple_string(iter, MESSAGE_KEY_PIN, s_pin, sizeof(s_pin));
    copy_tuple_string(iter, MESSAGE_KEY_BODY, s_body, sizeof(s_body));
    hide_menu();
    set_screen(SCREEN_PIN);
  } else if (strcmp(screen, "list") == 0) {
    parse_list(iter);
    show_menu();
  } else if (strcmp(screen, "loading") == 0) {
    copy_tuple_string(iter, MESSAGE_KEY_TITLE, s_title, sizeof(s_title));
    copy_tuple_string(iter, MESSAGE_KEY_BODY, s_body, sizeof(s_body));
    hide_menu();
    set_screen(SCREEN_LOADING);
  }
}

static void inbox_dropped_callback(AppMessageResult reason, void *context) {
  s_busy = false;
  APP_LOG(APP_LOG_LEVEL_WARNING, "inbox dropped: %d", reason);
  set_error("Phone response too large");
}

static void outbox_failed_callback(DictionaryIterator *iter, AppMessageResult reason, void *context) {
  s_busy = false;
  APP_LOG(APP_LOG_LEVEL_WARNING, "outbox failed: %d", reason);
  set_error("Update failed");
}

static void outbox_sent_callback(DictionaryIterator *iter, void *context) {
}

void app_message_init(void) {
  app_message_register_inbox_received(inbox_received_callback);
  app_message_register_inbox_dropped(inbox_dropped_callback);
  app_message_register_outbox_failed(outbox_failed_callback);
  app_message_register_outbox_sent(outbox_sent_callback);
  app_message_open(2048, 256);
}
