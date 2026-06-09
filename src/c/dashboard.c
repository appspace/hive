#include "hive.h"

static GColor dashboard_mode_color(void) {
  if (strcmp(s_dashboard.mode_color, "heat") == 0) {
    return hive_heat();
  }
  if (strcmp(s_dashboard.mode_color, "cool") == 0) {
    return hive_cool();
  }
  return hive_white();
}

static void draw_text(GContext *ctx, const char *text, GFont font, GRect rect,
                      GTextAlignment alignment, GColor color) {
  graphics_context_set_text_color(ctx, color);
  graphics_draw_text(ctx, text ? text : "", font, rect, GTextOverflowModeTrailingEllipsis,
                     alignment, NULL);
}

static void draw_droplet(GContext *ctx, GPoint origin, GColor color) {
  graphics_context_set_fill_color(ctx, color);
  const int rows[][5] = {
    {1, 10, 1, 0, 0},  {2, 10, 1, 0, 0},  {3, 9, 3, 0, 0},
    {4, 9, 3, 0, 0},   {5, 8, 2, 11, 2},  {6, 7, 2, 12, 2},
    {7, 7, 1, 13, 1},  {8, 6, 2, 13, 2},  {9, 5, 2, 14, 2},
    {10, 5, 1, 15, 1}, {11, 4, 2, 15, 2}, {12, 4, 1, 16, 1},
    {13, 4, 1, 16, 1}, {14, 4, 2, 15, 2}, {15, 4, 2, 15, 1},
    {16, 5, 2, 14, 2}, {17, 6, 3, 12, 3}, {18, 8, 5, 0, 0},
  };

  for (unsigned int i = 0; i < ARRAY_LENGTH(rows); i++) {
    graphics_fill_rect(ctx, GRect(origin.x + rows[i][1], origin.y + rows[i][0], rows[i][2], 1),
                       0, GCornerNone);
    if (rows[i][4] > 0) {
      graphics_fill_rect(ctx,
                         GRect(origin.x + rows[i][3], origin.y + rows[i][0], rows[i][4], 1),
                         0, GCornerNone);
    }
  }
}

static void draw_humidity(GContext *ctx, GRect bounds, int y) {
  GFont font = fonts_get_system_font(FONT_KEY_GOTHIC_24);
  char text[TEXT_SHORT + 2];
  snprintf(text, sizeof(text), "%s%%", s_dashboard.humidity[0] ? s_dashboard.humidity : "0");
  int text_width = graphics_text_layout_get_content_size(
                     text, font, GRect(0, 0, bounds.size.w, 28),
                     GTextOverflowModeTrailingEllipsis, GTextAlignmentLeft).w;
  int total_width = 20 + 5 + text_width;
  int x = bounds.origin.x + (bounds.size.w - total_width) / 2;

  draw_droplet(ctx, GPoint(x, y + 3), hive_white());
  draw_text(ctx, text, font, GRect(x + 25, y - 3, text_width + 4, 28), GTextAlignmentLeft,
            hive_white());
}

static void draw_desired_pill(GContext *ctx, GRect bounds, int y) {
  GFont font = fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD);
  GColor mode_color = dashboard_mode_color();
  GColor pill_color = strcmp(s_dashboard.mode_color, "auto") == 0 ? hive_white() : mode_color;
  int width = bounds.size.w - 20;
  int maxWidth = PBL_PLATFORM_SWITCH(PBL_PLATFORM_TYPE_CURRENT, 70, 70, 70, 70, 70, 110, 70);
  if (width > maxWidth) {
    width = maxWidth;
  }
  GRect rect = GRect(bounds.origin.x + (bounds.size.w - width) / 2, y, width, 34);

  graphics_context_set_stroke_color(ctx, pill_color);
  graphics_draw_round_rect(ctx, rect, 16);
  graphics_draw_round_rect(ctx, GRect(rect.origin.x + 1, rect.origin.y + 1, rect.size.w - 2,
                                      rect.size.h - 2),
                           15);

  char text[TEXT_LONG];
  if (strcmp(s_dashboard.mode_color, "auto") == 0) {
    snprintf(text, sizeof(text), "%s-%s%s", s_dashboard.heat_hold[0] ? s_dashboard.heat_hold : "--",
             s_dashboard.cool_hold[0] ? s_dashboard.cool_hold : "--",
             s_dashboard.hold ? " | Holding" : "");
    draw_text(ctx, text, font, rect, GTextAlignmentCenter, hive_white());
  } else {
    snprintf(text, sizeof(text), "%s%s",
             s_dashboard.desired_temperature[0] ? s_dashboard.desired_temperature : "Off",
             s_dashboard.hold ? " | Holding" : "");
    draw_text(ctx, text, font, rect, GTextAlignmentCenter, mode_color);
  }
}

static int text_width(const char *text, GFont font, int height) {
  return graphics_text_layout_get_content_size(text, font, GRect(0, 0, 200, height),
                                               GTextOverflowModeTrailingEllipsis,
                                               GTextAlignmentLeft)
    .w;
}

static void draw_temperature(GContext *ctx, GRect bounds, int y) {
  const char *value = s_dashboard.temperature[0] ? s_dashboard.temperature : "--";
  char whole[TEXT_SHORT];
  char fraction[TEXT_SHORT] = "";
  char *point = strchr(value, '.');
  GFont temp_font = fonts_get_system_font(FONT_KEY_ROBOTO_BOLD_SUBSET_49);
  int temp_height = 54;
  int decimal_width = 8;

  if (!point) {
    GFont display_font = strcmp(value, "--") == 0 ? fonts_get_system_font(FONT_KEY_GOTHIC_28_BOLD)
                                                  : temp_font;
    draw_text(ctx, value, display_font, GRect(0, y, bounds.size.w, temp_height),
              GTextAlignmentCenter, hive_white());
    return;
  }

  if (strcmp(value, "--") == 0) {
    draw_text(ctx, value, fonts_get_system_font(FONT_KEY_GOTHIC_28_BOLD),
              GRect(0, y, bounds.size.w, temp_height), GTextAlignmentCenter,
              hive_white());
    return;
  }

  int whole_len = point - value;
  if (whole_len >= (int)sizeof(whole)) {
    whole_len = sizeof(whole) - 1;
  }
  memcpy(whole, value, whole_len);
  whole[whole_len] = '\0';
  copy_text(fraction, sizeof(fraction), point + 1);

  int whole_width = text_width(whole, temp_font, temp_height);
  int fraction_width = text_width(fraction, temp_font, temp_height);
  int x = (bounds.size.w - whole_width - decimal_width - fraction_width) / 2;
  int dot_size = 5;
  int dot_x = x + whole_width + (decimal_width - dot_size) / 2;
  int dot_y = y + 44;

  draw_text(ctx, whole, temp_font, GRect(x, y, whole_width + 2, temp_height),
            GTextAlignmentLeft, hive_white());
  // Roboto's large numeric subset does not include punctuation, so draw the decimal manually.
  graphics_context_set_fill_color(ctx, hive_white());
  graphics_fill_circle(ctx, GPoint(dot_x + dot_size / 2, dot_y + dot_size / 2), dot_size / 2);
  draw_text(ctx, fraction, temp_font,
            GRect(x + whole_width + decimal_width, y, fraction_width + 2, temp_height),
            GTextAlignmentLeft, hive_white());
}

static void draw_dashboard(GContext *ctx, GRect bounds) {
  const bool round = bounds.size.w == bounds.size.h;
  GFont title_font = fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD);

  GRect title_rect =
    round ? GRect(22, 14, bounds.size.w - 44, 28) : GRect(4, 2, bounds.size.w - 8, 28);
  draw_text(ctx, s_dashboard.name, title_font, title_rect,
            round ? GTextAlignmentCenter : GTextAlignmentLeft, hive_white());

  int center_y = bounds.size.h / 2 - 10;
  int pill_offset =
    PBL_PLATFORM_SWITCH(PBL_PLATFORM_TYPE_CURRENT, 38, 38, 38, 38, 38, 32, 38);
  draw_humidity(ctx, bounds, center_y - 46);
  draw_temperature(ctx, bounds, center_y - 30);
  draw_desired_pill(ctx, bounds, center_y + pill_offset);

  if (s_dashboard.status[0]) {
    draw_text(ctx, s_dashboard.status, fonts_get_system_font(FONT_KEY_GOTHIC_18),
              GRect(0, bounds.size.h - 42, bounds.size.w, 22), GTextAlignmentCenter,
              hive_white());
  }
}

void main_layer_update_proc(Layer *layer, GContext *ctx) {
  GRect bounds = layer_get_bounds(layer);
  graphics_context_set_fill_color(ctx, hive_black());
  graphics_fill_rect(ctx, bounds, 0, GCornerNone);
  graphics_context_set_fill_color(ctx, hive_panel());
  graphics_fill_rect(ctx, GRect(0, 0, bounds.size.w, 22), 0, GCornerNone);
  graphics_fill_rect(ctx, GRect(0, bounds.size.h - 18, bounds.size.w, 18), 0, GCornerNone);

  if (s_screen == SCREEN_DASHBOARD) {
    draw_dashboard(ctx, bounds);
  } else if (s_screen == SCREEN_PIN) {
    draw_pin_screen(ctx, bounds);
  } else if (s_screen == SCREEN_ERROR) {
    draw_text(ctx, "Error", fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD),
              GRect(0, bounds.size.h / 2 - 38, bounds.size.w, 30), GTextAlignmentCenter,
              hive_white());
    draw_text(ctx, s_error, fonts_get_system_font(FONT_KEY_GOTHIC_24),
              GRect(8, bounds.size.h / 2 - 8, bounds.size.w - 16, 58), GTextAlignmentCenter,
              hive_white());
  } else {
    draw_text(ctx, s_title, fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD),
              GRect(0, bounds.size.h / 2 - 40, bounds.size.w, 30), GTextAlignmentCenter,
              hive_white());
    draw_text(ctx, s_body, fonts_get_system_font(FONT_KEY_GOTHIC_24),
              GRect(8, bounds.size.h / 2 - 8, bounds.size.w - 16, 58), GTextAlignmentCenter,
              hive_white());
  }
}
