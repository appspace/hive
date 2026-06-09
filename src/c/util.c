#include "hive.h"

GColor hive_black(void) { return GColorBlack; }
GColor hive_white(void) { return GColorWhite; }

GColor hive_panel(void) {
#ifdef PBL_COLOR
  return GColorFromHEX(0x181818);
#else
  return GColorBlack;
#endif
}

GColor hive_menu_bg(void) {
#ifdef PBL_COLOR
  return GColorFromHEX(0x555555);
#else
  return GColorDarkGray;
#endif
}

GColor hive_highlight(void) {
#ifdef PBL_COLOR
  return GColorFromHEX(0xaaff00);
#else
  return GColorWhite;
#endif
}

GColor hive_heat(void) {
#ifdef PBL_COLOR
  return GColorFromHEX(0xff5500);
#else
  return GColorWhite;
#endif
}

GColor hive_cool(void) {
#ifdef PBL_COLOR
  return GColorFromHEX(0x00aaff);
#else
  return GColorWhite;
#endif
}

void copy_text(char *dest, size_t dest_size, const char *source) {
  if (!dest || !dest_size) {
    return;
  }
  snprintf(dest, dest_size, "%s", source ? source : "");
}

void copy_tuple_string(DictionaryIterator *iter, uint32_t key, char *dest, size_t dest_size) {
  Tuple *tuple = dict_find(iter, key);
  if (tuple && tuple->type == TUPLE_CSTRING) {
    copy_text(dest, dest_size, tuple->value->cstring);
  }
}

int32_t tuple_int(DictionaryIterator *iter, uint32_t key, int32_t fallback) {
  Tuple *tuple = dict_find(iter, key);
  return tuple ? tuple->value->int32 : fallback;
}

bool tuple_bool(DictionaryIterator *iter, uint32_t key) {
  return tuple_int(iter, key, 0) != 0;
}

uint32_t item_title_key(int index) {
  switch (index) {
    case 0:
      return MESSAGE_KEY_ITEM_0_TITLE;
    case 1:
      return MESSAGE_KEY_ITEM_1_TITLE;
    case 2:
      return MESSAGE_KEY_ITEM_2_TITLE;
    case 3:
      return MESSAGE_KEY_ITEM_3_TITLE;
    case 4:
      return MESSAGE_KEY_ITEM_4_TITLE;
    case 5:
      return MESSAGE_KEY_ITEM_5_TITLE;
    case 6:
      return MESSAGE_KEY_ITEM_6_TITLE;
    case 7:
      return MESSAGE_KEY_ITEM_7_TITLE;
    case 8:
      return MESSAGE_KEY_ITEM_8_TITLE;
    case 9:
      return MESSAGE_KEY_ITEM_9_TITLE;
    case 10:
      return MESSAGE_KEY_ITEM_10_TITLE;
    case 11:
      return MESSAGE_KEY_ITEM_11_TITLE;
    case 12:
      return MESSAGE_KEY_ITEM_12_TITLE;
    case 13:
      return MESSAGE_KEY_ITEM_13_TITLE;
    case 14:
      return MESSAGE_KEY_ITEM_14_TITLE;
    case 15:
      return MESSAGE_KEY_ITEM_15_TITLE;
    case 16:
      return MESSAGE_KEY_ITEM_16_TITLE;
    case 17:
      return MESSAGE_KEY_ITEM_17_TITLE;
    case 18:
      return MESSAGE_KEY_ITEM_18_TITLE;
    default:
      return MESSAGE_KEY_ITEM_19_TITLE;
  }
}

uint32_t item_subtitle_key(int index) {
  switch (index) {
    case 0:
      return MESSAGE_KEY_ITEM_0_SUBTITLE;
    case 1:
      return MESSAGE_KEY_ITEM_1_SUBTITLE;
    case 2:
      return MESSAGE_KEY_ITEM_2_SUBTITLE;
    case 3:
      return MESSAGE_KEY_ITEM_3_SUBTITLE;
    case 4:
      return MESSAGE_KEY_ITEM_4_SUBTITLE;
    case 5:
      return MESSAGE_KEY_ITEM_5_SUBTITLE;
    case 6:
      return MESSAGE_KEY_ITEM_6_SUBTITLE;
    case 7:
      return MESSAGE_KEY_ITEM_7_SUBTITLE;
    case 8:
      return MESSAGE_KEY_ITEM_8_SUBTITLE;
    case 9:
      return MESSAGE_KEY_ITEM_9_SUBTITLE;
    case 10:
      return MESSAGE_KEY_ITEM_10_SUBTITLE;
    case 11:
      return MESSAGE_KEY_ITEM_11_SUBTITLE;
    case 12:
      return MESSAGE_KEY_ITEM_12_SUBTITLE;
    case 13:
      return MESSAGE_KEY_ITEM_13_SUBTITLE;
    case 14:
      return MESSAGE_KEY_ITEM_14_SUBTITLE;
    case 15:
      return MESSAGE_KEY_ITEM_15_SUBTITLE;
    case 16:
      return MESSAGE_KEY_ITEM_16_SUBTITLE;
    case 17:
      return MESSAGE_KEY_ITEM_17_SUBTITLE;
    case 18:
      return MESSAGE_KEY_ITEM_18_SUBTITLE;
    default:
      return MESSAGE_KEY_ITEM_19_SUBTITLE;
  }
}

uint32_t item_value_key(int index) {
  switch (index) {
    case 0:
      return MESSAGE_KEY_ITEM_0_VALUE;
    case 1:
      return MESSAGE_KEY_ITEM_1_VALUE;
    case 2:
      return MESSAGE_KEY_ITEM_2_VALUE;
    case 3:
      return MESSAGE_KEY_ITEM_3_VALUE;
    case 4:
      return MESSAGE_KEY_ITEM_4_VALUE;
    case 5:
      return MESSAGE_KEY_ITEM_5_VALUE;
    case 6:
      return MESSAGE_KEY_ITEM_6_VALUE;
    case 7:
      return MESSAGE_KEY_ITEM_7_VALUE;
    case 8:
      return MESSAGE_KEY_ITEM_8_VALUE;
    case 9:
      return MESSAGE_KEY_ITEM_9_VALUE;
    case 10:
      return MESSAGE_KEY_ITEM_10_VALUE;
    case 11:
      return MESSAGE_KEY_ITEM_11_VALUE;
    case 12:
      return MESSAGE_KEY_ITEM_12_VALUE;
    case 13:
      return MESSAGE_KEY_ITEM_13_VALUE;
    case 14:
      return MESSAGE_KEY_ITEM_14_VALUE;
    case 15:
      return MESSAGE_KEY_ITEM_15_VALUE;
    case 16:
      return MESSAGE_KEY_ITEM_16_VALUE;
    case 17:
      return MESSAGE_KEY_ITEM_17_VALUE;
    case 18:
      return MESSAGE_KEY_ITEM_18_VALUE;
    default:
      return MESSAGE_KEY_ITEM_19_VALUE;
  }
}
