#include "hive.h"

static void draw_text(GContext *ctx, const char *text, GFont font, GRect rect,
                      GTextAlignment alignment, GColor color) {
  graphics_context_set_text_color(ctx, color);
  graphics_draw_text(ctx, text ? text : "", font, rect, GTextOverflowModeTrailingEllipsis,
                     alignment, NULL);
}

void draw_pin_screen(GContext *ctx, GRect bounds) {
  GFont pin_font = fonts_get_system_font(PBL_PLATFORM_SWITCH(
    PBL_PLATFORM_TYPE_CURRENT, FONT_KEY_BITHAM_30_BLACK, FONT_KEY_BITHAM_30_BLACK,
    FONT_KEY_BITHAM_30_BLACK, FONT_KEY_BITHAM_30_BLACK, FONT_KEY_BITHAM_30_BLACK,
    FONT_KEY_GOTHIC_28_BOLD, FONT_KEY_BITHAM_30_BLACK));
  int pin_y =
    PBL_PLATFORM_SWITCH(PBL_PLATFORM_TYPE_CURRENT, 52, 52, 52, 52, 52, 8, 52);
  int pin_height =
    PBL_PLATFORM_SWITCH(PBL_PLATFORM_TYPE_CURRENT, 38, 38, 38, 38, 38, 34, 38);
  int body_y =
    PBL_PLATFORM_SWITCH(PBL_PLATFORM_TYPE_CURRENT, 96, 96, 96, 96, 96, 46, 96);
  int body_height = bounds.size.h - body_y - 8;

  draw_text(ctx, s_pin, pin_font, GRect(0, pin_y, bounds.size.w, pin_height),
            GTextAlignmentCenter, hive_cool());
  draw_text(ctx, s_body, fonts_get_system_font(FONT_KEY_GOTHIC_18),
            GRect(8, body_y, bounds.size.w - 16, body_height), GTextAlignmentCenter,
            hive_white());
}
