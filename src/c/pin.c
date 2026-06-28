#include "hive.h"

static void draw_text(GContext *ctx, const char *text, GFont font, GRect rect,
                      GTextAlignment alignment, GColor color) {
  graphics_context_set_text_color(ctx, color);
  graphics_draw_text(ctx, text ? text : "", font, rect, GTextOverflowModeTrailingEllipsis,
                     alignment, NULL);
}

void draw_pin_screen(GContext *ctx, GRect bounds) {
#ifdef PBL_PLATFORM_FLINT
  GFont pin_font = fonts_get_system_font(FONT_KEY_GOTHIC_28_BOLD);
  int pin_y = 8;
  int pin_height = 34;
  int body_y = 46;
  GFont body_font = fonts_get_system_font(FONT_KEY_GOTHIC_18);
#else
  GFont pin_font = fonts_get_system_font(FONT_KEY_BITHAM_30_BLACK);
  int pin_y = 52;
  int pin_height = 38;
  int body_y = 96;
  GFont body_font = fonts_get_system_font(FONT_KEY_GOTHIC_24);
#endif
  int body_height = bounds.size.h - body_y - 8;

  draw_text(ctx, s_pin, pin_font, GRect(0, pin_y, bounds.size.w, pin_height),
            GTextAlignmentCenter, hive_cool());
  draw_text(ctx, s_body, body_font, GRect(8, body_y, bounds.size.w - 16, body_height),
            GTextAlignmentCenter, hive_white());
}
