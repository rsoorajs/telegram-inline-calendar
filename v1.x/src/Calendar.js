const lang = require("./language.json");
const dayjs = require('dayjs');

module.exports = class Calendar {
    constructor(bot, options = {}) {
        this.options = options;
        this.options.language = (typeof options.language === 'undefined') ? 'en' : options.language;
        this.options.date_format = (typeof options.date_format === 'undefined') ? 'YYYY-MM-DD' : options.date_format;
        this.options.bot_api = (typeof options.bot_api === 'undefined') ? 'node-telegram-bot-api' : options.bot_api;
        this.options.close_calendar = (typeof options.close_calendar === 'undefined') ? true : options.close_calendar;
        this.options.start_week_day = (typeof options.start_week_day === 'undefined') ? 0 : options.start_week_day;
        this.options.time_selector_mod = (typeof options.time_selector_mod === 'undefined') ? false : options.time_selector_mod;
        this.options.time_range = (typeof options.time_range === 'undefined') ? "00:00-23:59" : options.time_range;
        this.options.time_step = (typeof options.time_step === 'undefined') ? "30m" : options.time_step;
        this.options.user_lang_select = (typeof options.user_lang_select === 'undefined') ? false : options.user_lang_select;
        this.options.skip_years = (typeof options.skip_years === 'undefined') ? false : options.skip_years;
        if (typeof options.start_date === 'undefined') {
            this.options.start_date = false;
        } else {
            if (options.start_date === 'now') {
                this.options.start_date = dayjs().format("YYYY-MM-DD HH:mm");
            } else {
                this.options.start_date = dayjs(options.start_date).format("YYYY-MM-DD HH:mm");
            }
        }
        if (typeof options.stop_date === 'undefined') {
            this.options.stop_date = false;
        } else {
            if (options.stop_date === 'now') {
                this.options.stop_date = dayjs().format("YYYY-MM-DD HH:mm");
            } else if (dayjs(options.stop_date).format("HH:mm") == '00:00') {
                this.options.stop_date = dayjs(options.stop_date).format("YYYY-MM-DD") + " 23:59";
            } else {
                this.options.stop_date = dayjs(options.stop_date).format("YYYY-MM-DD HH:mm");
            }
        }
        this.options.custom_start_msg = (typeof options.custom_start_msg === 'undefined') ? false : options.custom_start_msg;
        this.options.lock_datetime = (typeof options.lock_datetime === 'undefined') ? false : options.lock_datetime;
        this.options.lock_date = (typeof options.lock_date === 'undefined') ? false : options.lock_date;
        if (this.options.lock_datetime) {
            this.lock_datetime_array = new Array();
        }
        if (this.options.lock_date) {
            this.lock_date_array = new Array();
        }
        if (this.options.user_lang_select) {
            this.user_lang = new Map();
        }
        this.bot = bot;
        this.chats = new Map();
        this.addCustomStartMsg();
        this.libraryInitialization();
        this.dateFuncInitialization();
        this.datetimeFuncInitialization();
    }
    NodeTelegramBotApi = {
        editMessageReplyMarkupCalendar(date, query) {
            this.bot.editMessageReplyMarkup(this.createNavigationKeyboard(this.checkLanguage(query.message.chat.id), date),{message_id: query.message.message_id, chat_id: query.message.chat.id})
        },
        editMessageReplyMarkupTime(date, query, from_calendar) {
            this.bot.editMessageReplyMarkup(this.createTimeSelector(this.checkLanguage(query.message.chat.id), date, from_calendar),{message_id: query.message.message_id, chat_id: query.message.chat.id})
        },
        sendMessageCalendar(menu, msg) {
            var l = (this.options.time_selector_mod === true) ? lang.selectdatetime[this.checkLanguage(msg.chat.id)] : lang.select[this.checkLanguage(msg.chat.id)];
            this.bot.sendMessage(msg.chat.id, l, menu).then((msg_promise) => this.chats.set(msg_promise.chat.id, msg_promise.message_id));
        },
        sendMessageTime(menu, msg) {
            this.bot.sendMessage(msg.chat.id, lang.selecttime[this.checkLanguage(msg.chat.id)], menu).then((msg_promise) => this.chats.set(msg_promise.chat.id, msg_promise.message_id))
        },
        sendMessageLanguageSelect(menu, msg) {
            this.bot.sendMessage(msg.chat.id, lang.selectlang[this.options.language], menu).then((msg_promise) => this.chats.set(msg_promise.chat.id, msg_promise.message_id))
        },
        deleteMessage(query) {
            this.bot.deleteMessage(query.message.chat.id,query.message.message_id)
        },
        replyMarkupObject(cnk) {
            var menu = {};
            menu.reply_markup = cnk;
            return menu;
        }
    };
    Telegraf = {
        editMessageReplyMarkupCalendar(date, query) {
            this.bot.telegram.editMessageReplyMarkup(query.message.chat.id, query.message.message_id, null, this.createNavigationKeyboard(this.checkLanguage(query.message.chat.id), date))
        },
        editMessageReplyMarkupTime(date, query, from_calendar) {
            this.bot.telegram.editMessageReplyMarkup(query.message.chat.id, query.message.message_id, null, this.createTimeSelector(this.checkLanguage(query.message.chat.id), date, from_calendar))
        },
        sendMessageCalendar(menu, msg) {
            var l = (this.options.time_selector_mod === true) ? lang.selectdatetime[this.checkLanguage(msg.chat.id)] : lang.select[this.checkLanguage(msg.chat.id)];
            this.bot.telegram.sendMessage(msg.chat.id, l, menu).then((msg_promise) => this.chats.set(msg_promise.chat.id, msg_promise.message_id));
        },
        sendMessageTime(menu, msg) {
            this.bot.telegram.sendMessage(msg.chat.id, lang.selecttime[this.checkLanguage(msg.chat.id)], menu).then((msg_promise) => this.chats.set(msg_promise.chat.id, msg_promise.message_id))
        },
        sendMessageLanguageSelect(menu, msg) {
            this.bot.telegram.sendMessage(msg.chat.id, lang.selectlang[this.options.language], menu).then((msg_promise) => this.chats.set(msg_promise.chat.id, msg_promise.message_id))
        },
        deleteMessage(query) {
            this.bot.telegram.deleteMessage(query.message.chat.id,query.message.message_id)
        },
        replyMarkupObject(cnk) {
            var menu = {};
            menu.reply_markup = cnk;
            return menu;
        }
    };
    Telebot = {
        editMessageReplyMarkupCalendar(date, query) {
            this.bot.editMessageReplyMarkup({messageId: query.message.message_id, chatId: query.message.chat.id}, this.replyMarkupObject(this.createNavigationKeyboard(this.checkLanguage(query.message.chat.id), date)));
        },
        editMessageReplyMarkupTime(date, query, from_calendar) {
            this.bot.editMessageReplyMarkup({messageId: query.message.message_id, chatId: query.message.chat.id}, this.replyMarkupObject(this.createTimeSelector(this.checkLanguage(query.message.chat.id), date, from_calendar)));
        },
        sendMessageCalendar(menu, msg) {
            var l = (this.options.time_selector_mod === true) ? lang.selectdatetime[this.checkLanguage(msg.chat.id)] : lang.select[this.checkLanguage(msg.chat.id)];
            this.bot.sendMessage(msg.chat.id, l, menu).then((msg_promise) => this.chats.set(msg_promise.chat.id, msg_promise.message_id));
        },
        sendMessageTime(menu, msg) {
            this.bot.sendMessage(msg.chat.id, lang.selecttime[this.checkLanguage(msg.chat.id)], menu).then((msg_promise) => this.chats.set(msg_promise.chat.id, msg_promise.message_id))
        },
        sendMessageLanguageSelect(menu, msg) {
            this.bot.sendMessage(msg.chat.id, lang.selectlang[this.options.language], menu).then((msg_promise) => this.chats.set(msg_promise.chat.id, msg_promise.message_id))
        },
        deleteMessage(query) {
            this.bot.deleteMessage(query.message.chat.id,query.message.message_id)
        },
        replyMarkupObject(cnk) {
            var menu = {};
            menu.replyMarkup = cnk;
            return menu;
        }

    };
    Grammy = {
        editMessageReplyMarkupCalendar(date, query) {
            this.bot.api.editMessageReplyMarkup(query.message.chat.id, query.message.message_id, this.replyMarkupObject(this.createNavigationKeyboard(this.checkLanguage(query.message.chat.id), date)));
        },
        editMessageReplyMarkupTime(date, query, from_calendar) {
            this.bot.api.editMessageReplyMarkup(query.message.chat.id, query.message.message_id, this.replyMarkupObject(this.createTimeSelector(this.checkLanguage(query.message.chat.id), date, from_calendar)));
        },
        sendMessageCalendar(menu, msg) {
            var l = (this.options.time_selector_mod === true) ? lang.selectdatetime[this.checkLanguage(msg.chat.id)] : lang.select[this.checkLanguage(msg.chat.id)];
            this.bot.api.sendMessage(msg.chat.id, l, menu).then((msg_promise) => this.chats.set(msg_promise.chat.id, msg_promise.message_id));
        },
        sendMessageTime(menu, msg) {
            this.bot.api.sendMessage(msg.chat.id, lang.selecttime[this.checkLanguage(msg.chat.id)], menu).then((msg_promise) => this.chats.set(msg_promise.chat.id, msg_promise.message_id))
        },
        sendMessageLanguageSelect(menu, msg) {
            this.bot.api.sendMessage(msg.chat.id, lang.selectlang[this.options.language], menu).then((msg_promise) => this.chats.set(msg_promise.chat.id, msg_promise.message_id))
        },
        deleteMessage(query) {
            this.bot.api.deleteMessage(query.message.chat.id,query.message.message_id)
        },
        replyMarkupObject(cnk) {
            var menu = {};
            menu.reply_markup = cnk;
            return menu;
        }
    };
    DatetimeFunc = {
        withoutLockDatetime(stop, datetime, type) {
            return (dayjs(stop).diff(datetime, type) < 0) ? true : false;
        },
        withLockDatetime(stop, datetime, type) {
            return (dayjs(stop).diff(datetime, type) < 0 || this.lock_datetime_array.includes(datetime)) ? true : false;
        }
    };
    DateFunc = {
        withoutLockDate(date, d) {
            if ((!this.options.start_date || (this.options.start_date && dayjs(date).date(d).hour(0).minute(0).diff(dayjs(this.options.start_date).hour(0).minute(0), 'day') >= 0)) && (!this.options.stop_date || (this.options.stop_date && dayjs(this.options.stop_date).hour(0).minute(0).diff(dayjs(date).date(d).hour(0).minute(0), 'day') >= 0))) {
                return true;
            }
            return false;
        },
        withLockDate(date, d) {
            if ((!this.options.start_date || (this.options.start_date && dayjs(date).date(d).hour(0).minute(0).diff(dayjs(this.options.start_date).hour(0).minute(0), 'day') >= 0)) && (!this.options.stop_date || (this.options.stop_date && dayjs(this.options.stop_date).hour(0).minute(0).diff(dayjs(date).date(d).hour(0).minute(0), 'day') >= 0)) && !this.lock_date_array.includes(date.getFullYear() + '-' + this.twoDigits(date.getMonth() + 1) + '-' + this.twoDigits(d))) {
                return true;
            }
            return false;
        }
    };
    checkLanguage(chat_id) {
        if (this.options.user_lang_select) {
            return this.user_lang.get(chat_id);
        }
        return this.options.language;
    }
    addCustomStartMsg() {
        if (this.options.custom_start_msg !== false) {
            if (this.options.user_lang_select) {
                Object.keys(lang.select).forEach(function(key, index) {
                    lang.select[key] = this.options.custom_start_msg;
                    lang.selectdatetime[key] = this.options.custom_start_msg;
                    lang.selecttime[key] = this.options.custom_start_msg;
                });
            } else {
                lang.select[this.options.language] = this.options.custom_start_msg;
                lang.selectdatetime[this.options.language] = this.options.custom_start_msg;
                lang.selecttime[this.options.language] = this.options.custom_start_msg;
            }
        }
    }
    libraryInitialization() {
        if (this.options.bot_api == 'node-telegram-bot-api') {
            this.editMessageReplyMarkupCalendar = this.NodeTelegramBotApi.editMessageReplyMarkupCalendar;
            this.editMessageReplyMarkupTime = this.NodeTelegramBotApi.editMessageReplyMarkupTime;
            this.sendMessageCalendar = this.NodeTelegramBotApi.sendMessageCalendar;
            this.sendMessageTime = this.NodeTelegramBotApi.sendMessageTime;
            this.sendMessageLanguageSelect = this.NodeTelegramBotApi.sendMessageLanguageSelect;
            this.deleteMessage = this.NodeTelegramBotApi.deleteMessage;
            this.replyMarkupObject = this.NodeTelegramBotApi.replyMarkupObject;
        } else if (this.options.bot_api == 'telegraf') {
            this.editMessageReplyMarkupCalendar = this.Telegraf.editMessageReplyMarkupCalendar;
            this.editMessageReplyMarkupTime = this.Telegraf.editMessageReplyMarkupTime;
            this.sendMessageCalendar = this.Telegraf.sendMessageCalendar;
            this.sendMessageTime = this.Telegraf.sendMessageTime;
            this.sendMessageLanguageSelect = this.Telegraf.sendMessageLanguageSelect;
            this.deleteMessage = this.Telegraf.deleteMessage;
            this.replyMarkupObject = this.Telegraf.replyMarkupObject;
        } else if (this.options.bot_api == 'telebot') {
            this.editMessageReplyMarkupCalendar = this.Telebot.editMessageReplyMarkupCalendar;
            this.editMessageReplyMarkupTime = this.Telebot.editMessageReplyMarkupTime;
            this.sendMessageCalendar = this.Telebot.sendMessageCalendar;
            this.sendMessageTime = this.Telebot.sendMessageTime;
            this.sendMessageLanguageSelect = this.Telebot.sendMessageLanguageSelect;
            this.deleteMessage = this.Telebot.deleteMessage;
            this.replyMarkupObject = this.Telebot.replyMarkupObject;
        } else if (this.options.bot_api == 'grammy') {
            this.editMessageReplyMarkupCalendar = this.Grammy.editMessageReplyMarkupCalendar;
            this.editMessageReplyMarkupTime = this.Grammy.editMessageReplyMarkupTime;
            this.sendMessageCalendar = this.Grammy.sendMessageCalendar;
            this.sendMessageTime = this.Grammy.sendMessageTime;
            this.sendMessageLanguageSelect = this.Grammy.sendMessageLanguageSelect;
            this.deleteMessage = this.Grammy.deleteMessage;
            this.replyMarkupObject = this.Grammy.replyMarkupObject;
        }
    }
    dateFuncInitialization() {
        if (this.options.lock_date) {
            this.checkDate = this.DateFunc.withLockDate;
        } else {
            this.checkDate = this.DateFunc.withoutLockDate;
        }
    }
    datetimeFuncInitialization() {
        if (this.options.lock_datetime) {
            this.checkDatetime = this.DatetimeFunc.withLockDatetime;
        } else {
            this.checkDatetime = this.DatetimeFunc.withoutLockDatetime;
        }
    }
    weekDaysButtons(day) {
        return (day + this.options.start_week_day > 6) ? (day + this.options.start_week_day - 7) : (day + this.options.start_week_day);
    }
    startWeekDay(day) {
        return (day - this.options.start_week_day < 0) ? (day - this.options.start_week_day + 7) : (day - this.options.start_week_day);
    }
    twoDigits(num) {
        if (num < 10)
            return ('0' + num).slice(-2);
        return num
    }
    colRowNavigation(date, cd) {
        var tmp = cd - 7 + this.startWeekDay(date.getDay());
        return Math.ceil(tmp/7) + 4;
    }
    howMuchDays(year, month) {
        var date1 = new Date(year, month-1, 1);
        var date2 = new Date(year, month, 1);
        return Math.round((date2 - date1) / 1000 / 3600 / 24); 
    }
    createTimeSelector(user_lang_t, date = 'undefined', from_calendar = false) {
        var i, j;
        var start, stop;
        var time_range = this.options.time_range.split('-');
        var datetime = (date === 'undefined') ? new Date(2100,1,1,0,0,0) : new Date(date);
        var type = this.options.time_step.slice(-1);
        var step = this.options.time_step.slice(0, -1);
        var cnk = {};
        cnk.resize_keyboard = true;
        cnk.inline_keyboard = [];
        var d = 0, flag_start = 0, flag_stop = 0, fc = 0;
        if (from_calendar === true) {
            cnk.inline_keyboard.push([{},{},{}]);
            cnk.inline_keyboard[d][0] = {text: lang.back[user_lang_t], callback_data: 't_' + dayjs(datetime).format("YYYY-MM-DD") + '_back'};
            cnk.inline_keyboard[d][1] = {text: dayjs(datetime).format("YYYY-MM-DD"), callback_data: ' '};
            cnk.inline_keyboard[d][2] = {text: ' ', callback_data: ' '};
            fc++;
            d++;
        }
        if (this.options.start_date !== false) {
            if (dayjs(datetime).format("YYYY-MM-DD") != dayjs(this.options.start_date).format("YYYY-MM-DD")) {
                if (dayjs(datetime).format("HH") < time_range[0].split(':')[0] || (dayjs(datetime).format("HH") == time_range[0].split(':')[0] && dayjs(datetime).format("mm") <= time_range[0].split(':')[1])) {
                    datetime.setHours(time_range[0].split(':')[0]);
                    datetime.setMinutes(time_range[0].split(':')[1]);
                    datetime.setSeconds(0);
                    flag_start++;
                }
            } else {
                if (dayjs(datetime).format("HH") < time_range[0].split(':')[0] || (dayjs(datetime).format("HH") == time_range[0].split(':')[0] && dayjs(datetime).format("mm") <= time_range[0].split(':')[1])) {
                    datetime.setHours(time_range[0].split(':')[0]);
                    datetime.setMinutes(time_range[0].split(':')[1]);
                    datetime.setSeconds(0);
                    flag_start = 1;
                }
                if (dayjs(datetime).format("HH") < dayjs(this.options.start_date).format("HH") || (dayjs(datetime).format("HH") == dayjs(this.options.start_date).format("HH") && dayjs(datetime).format("mm") <= dayjs(this.options.start_date).format("mm"))) {
                    datetime.setHours(dayjs(this.options.start_date).format("H"));
                    datetime.setMinutes(dayjs(this.options.start_date).format("m"));
                    datetime.setSeconds(0);
                    flag_start = 1;
                }
            }
        } else {
            if (dayjs(datetime).format("HH") < time_range[0].split(':')[0] || (dayjs(datetime).format("HH") == time_range[0].split(':')[0] && dayjs(datetime).format("mm") <= time_range[0].split(':')[1])) {
                datetime.setHours(time_range[0].split(':')[0]);
                datetime.setMinutes(time_range[0].split(':')[1]);
                datetime.setSeconds(0);
                flag_start++;
            }
        }
        stop = new Date(datetime);
        stop.setHours(time_range[1].split(':')[0]);
        stop.setMinutes(time_range[1].split(':')[1]);
        stop.setSeconds(0);
        if (this.options.stop_date !== false && dayjs(stop).format("YYYY-MM-DD") == dayjs(this.options.stop_date).format("YYYY-MM-DD")) {
            if (dayjs(stop).format("HH") > dayjs(this.options.stop_date).format("HH") || (dayjs(stop).format("HH") == dayjs(this.options.stop_date).format("HH") && dayjs(stop).format("mm") > dayjs(this.options.stop_date).format("mm"))) {
                stop.setHours(dayjs(this.options.stop_date).format("H"));
                stop.setMinutes(dayjs(this.options.stop_date).format("m"));
                stop.setSeconds(0);
            }
        }
        for (i = d; i < d + 4; i++) {
            cnk.inline_keyboard.push([{},{},{},{}]);
            for(j = 0; j < 4; j++) {
                if (i === d && j === 0) {
                    start = new Date(datetime);
                }
                cnk.inline_keyboard[i][j] = (this.checkDatetime(stop, dayjs(datetime).format("YYYY-MM-DD HH:mm"), type)) ? {text: ' ', callback_data: ' '} : {text: dayjs(datetime).format("HH:mm"), callback_data: 't_' + dayjs(datetime).format("YYYY-MM-DD HH:mm")  + '_0'};
                datetime = new Date(dayjs(datetime).add(step, type).format("YYYY-MM-DD HH:mm"));
            }
            if (dayjs(stop).diff(dayjs(datetime).format("YYYY-MM-DD HH:mm"), type) < 0) {
                flag_stop++;
                i++;
                break;
            }
        }
        d = i;
        cnk.inline_keyboard.push([{},{},{}]);
        cnk.inline_keyboard[d][0] = (flag_start === 1) ? {text: ' ', callback_data: ' '} : {text: '<', callback_data: 't_' + dayjs(start).format("YYYY-MM-DD HH:mm") + '_' + fc + '-'};
        cnk.inline_keyboard[d][1] = {text: ' ', callback_data: ' '};
        cnk.inline_keyboard[d][2] = (flag_stop === 1) ? {text: ' ', callback_data: ' '} :{text: '>', callback_data: 't_' + dayjs(datetime).format("YYYY-MM-DD HH:mm") + '_' + fc + '+'};
        return cnk;
    }
    createNavigationKeyboard(user_lang_t, date) {
        var i, j;
        var cnk = {};
        var cd = this.howMuchDays(date.getFullYear(), date.getMonth() + 1);
        var cr = this.colRowNavigation(date, cd);
        cnk.resize_keyboard = true;
        cnk.inline_keyboard = [];
        if (!this.options.skip_years || this.options.skip_years <= 1 || this.options.skip_years > 10) {
            cnk.inline_keyboard.push([{},{},{}]);
            if (!this.options.start_date || (this.options.start_date && dayjs(date).format('YYYY') > dayjs(this.options.start_date).format('YYYY'))) {
                if (dayjs(date).subtract(1, 'year').format('YYYY') == dayjs(this.options.start_date).format('YYYY')) {
                    cnk.inline_keyboard[0][0] = {text: '<<', callback_data: 'n_' + dayjs(this.options.start_date).add(1, 'year').format("YYYY-MM") + '_--'};
                } else {
                    cnk.inline_keyboard[0][0] = {text: '<<', callback_data: 'n_' + dayjs(date).format("YYYY-MM") + '_--'};
                }
            } else {
                cnk.inline_keyboard[0][0] = {text: ' ', callback_data: ' '};
            }
            cnk.inline_keyboard[0][1] = {text: lang.month3[user_lang_t][date.getMonth()] + ' ' + date.getFullYear(), callback_data: ' '};
            if (!this.options.stop_date || (this.options.stop_date && dayjs(this.options.stop_date).format('YYYY') > dayjs(date).format('YYYY'))) {
                if (dayjs(date).add(1, 'year').format('YYYY') == dayjs(this.options.stop_date).format('YYYY')) {
                    cnk.inline_keyboard[0][2] = {text: '>>', callback_data: 'n_' + dayjs(this.options.stop_date).subtract(1, 'year').format("YYYY-MM") + '_++'};
                } else {
                    cnk.inline_keyboard[0][2] = {text: '>>', callback_data: 'n_' + dayjs(date).format("YYYY-MM") + '_++'};
                }
            } else {
                cnk.inline_keyboard[0][2] = {text: ' ', callback_data: ' '};
            }
        } else {
            cnk.inline_keyboard.push([{},{},{},{},{}]);
            if (!this.options.start_date || (this.options.start_date && dayjs(date).subtract(this.options.skip_years, 'year').format('YYYY') >= dayjs(this.options.start_date).format('YYYY'))) {
                if (dayjs(date).subtract(this.options.skip_years, 'year').format('YYYY') == dayjs(this.options.start_date).format('YYYY')) {
                    cnk.inline_keyboard[0][0] = {text: `<<${this.options.skip_years}`, callback_data: 'n_' + dayjs(this.options.start_date).add(this.options.skip_years, 'year').format("YYYY-MM") + '_---'};
                } else {
                    cnk.inline_keyboard[0][0] = {text: `<<${this.options.skip_years}`, callback_data: 'n_' + dayjs(date).format("YYYY-MM") + '_---'};
                }
            } else {
                cnk.inline_keyboard[0][0] = {text: ' ', callback_data: ' '};
            }
            if (!this.options.start_date || (this.options.start_date && dayjs(date).format('YYYY') > dayjs(this.options.start_date).format('YYYY'))) {
                if (dayjs(date).subtract(1, 'year').format('YYYY') == dayjs(this.options.start_date).format('YYYY')) {
                    cnk.inline_keyboard[0][1] = {text: '<<', callback_data: 'n_' + dayjs(this.options.start_date).add(1, 'year').format("YYYY-MM") + '_--'};
                } else {
                    cnk.inline_keyboard[0][1] = {text: '<<', callback_data: 'n_' + dayjs(date).format("YYYY-MM") + '_--'};
                }
            } else {
                cnk.inline_keyboard[0][1] = {text: ' ', callback_data: ' '};
            }
            cnk.inline_keyboard[0][2] = {text: ' ', callback_data: ' '};
            if (!this.options.stop_date || (this.options.stop_date && dayjs(this.options.stop_date).format('YYYY') > dayjs(date).format('YYYY'))) {
                if (dayjs(date).add(1, 'year').format('YYYY') == dayjs(this.options.stop_date).format('YYYY')) {
                    cnk.inline_keyboard[0][3] = {text: '>>', callback_data: 'n_' + dayjs(this.options.stop_date).subtract(1, 'year').format("YYYY-MM") + '_++'};
                } else {
                    cnk.inline_keyboard[0][3] = {text: '>>', callback_data: 'n_' + dayjs(date).format("YYYY-MM") + '_++'};
                }
            } else {
                cnk.inline_keyboard[0][3] = {text: ' ', callback_data: ' '};
            }
            if (!this.options.stop_date || (this.options.stop_date && dayjs(this.options.stop_date).format('YYYY') >= dayjs(date).add(this.options.skip_years, 'year').format('YYYY'))) {
                if (dayjs(date).add(this.options.skip_years, 'year').format('YYYY') == dayjs(this.options.stop_date).format('YYYY')) {
                    cnk.inline_keyboard[0][4] = {text: `${this.options.skip_years}>>`, callback_data: 'n_' + dayjs(this.options.stop_date).subtract(this.options.skip_years, 'year').format("YYYY-MM") + '_+++'};
                } else {
                    cnk.inline_keyboard[0][4] = {text: `${this.options.skip_years}>>`, callback_data: 'n_' + dayjs(date).format("YYYY-MM") + '_+++'};
                }
            } else {
                cnk.inline_keyboard[0][4] = {text: ' ', callback_data: ' '};
            }
        }
        cnk.inline_keyboard.push([{},{},{},{},{},{},{}]);
        for(j = 0; j < 7; j++) {
            cnk.inline_keyboard[1][j] = {text: lang.week[user_lang_t][this.weekDaysButtons(j)], callback_data: ' '};
        }
        var d = 1;
        for (i = 2; i <= cr - 2; i++) {
            cnk.inline_keyboard.push([{},{},{},{},{},{},{}]);
            for(j = 0; j < 7; j++) {
                if ((i == 2 && j < this.startWeekDay(date.getDay())) || d > cd) {
                    cnk.inline_keyboard[i][j] = {text: ' ', callback_data: ' '};
                } else {
                    if (this.checkDate(date, d)) {
                        cnk.inline_keyboard[i][j] = {text: d, callback_data: 'n_' + date.getFullYear() + '-' + this.twoDigits(date.getMonth() + 1) + '-' + this.twoDigits(d) + '_0'};
                    } else {
                        cnk.inline_keyboard[i][j] = {text: ' ', callback_data: ' '};
                    }
                    d++;
                }
            }
        }
        cnk.inline_keyboard.push([{},{},{}]);
        if (!this.options.start_date || (this.options.start_date && Math.round(dayjs(date).date(1).diff(dayjs(this.options.start_date).date(1), 'month', true)) > 0)) {
            cnk.inline_keyboard[cr - 1][0] = {text: '<', callback_data: 'n_' + dayjs(date).format("YYYY-MM") + '_-'};
        } else {
            cnk.inline_keyboard[cr - 1][0] = {text: ' ', callback_data: ' '};
        }
        if (!this.options.skip_years || this.options.skip_years <= 1 || this.options.skip_years > 10) {
            cnk.inline_keyboard[cr - 1][1] = {text: ' ', callback_data: ' '};
        } else {
            cnk.inline_keyboard[cr - 1][1] = {text: lang.month3[user_lang_t][date.getMonth()] + ' ' + date.getFullYear(), callback_data: ' '};
        }
        if (!this.options.stop_date || (this.options.stop_date && Math.round(dayjs(this.options.stop_date).date(1).diff(dayjs(date).date(1), 'month', true)) > 0)) {
            cnk.inline_keyboard[cr - 1][2] = {text: '>', callback_data: 'n_' + dayjs(date).format("YYYY-MM") + '_+'};
        } else {
            cnk.inline_keyboard[cr - 1][2] = {text: ' ', callback_data: ' '};
        }
        return cnk;
    }
    createLanguageSelectPanel(msg, type) {
        var cnk = {};
        cnk.resize_keyboard = true;
        cnk.inline_keyboard = [];
        Object.keys(lang.selectlang).forEach(function(key, index) {
            cnk.inline_keyboard.push([{text: lang.selectuserlang[key], callback_data: 'l_' + key + '_' + type}]);
        });
        this.sendMessageLanguageSelect(this.replyMarkupObject(cnk), msg);
    }
    startNavCalendar(msg) {
        if (this.options.user_lang_select) {
            this.user_lang.delete(msg.chat.id);
            this.createLanguageSelectPanel(msg, "calendar");
        } else {
            this.createStartCalendar(msg);
        }
    }
    startTimeSelector(msg) {
        if (this.options.user_lang_select) {
            this.user_lang.delete(msg.chat.id);
            this.createLanguageSelectPanel(msg, "timeselector");
        } else {
            this.createStartTimeSelector(msg);
        }
    }
    createStartCalendar(msg) {
        var now = new Date();
        now.setDate(1);
        now.setHours(0);
        now.setMinutes(0);
        now.setSeconds(0);
        if (this.options.start_date !== false) {
            if (new Date(dayjs(this.options.start_date).format("YYYY-MM-01")) > now) {
                this.sendMessageCalendar(this.replyMarkupObject(this.createNavigationKeyboard(this.checkLanguage(msg.chat.id), new Date(dayjs(this.options.start_date).format("YYYY-MM-01")))), msg);
            } else {
                if (this.options.stop_date !== false) {
                    if (new Date(this.options.stop_date) < now) {
                        this.sendMessageCalendar(this.replyMarkupObject(this.createNavigationKeyboard(this.checkLanguage(msg.chat.id), new Date(dayjs(this.options.start_date).format("YYYY-MM-01")))), msg);
                    } else {
                        this.sendMessageCalendar(this.replyMarkupObject(this.createNavigationKeyboard(this.checkLanguage(msg.chat.id), now)), msg);
                    }
                } else {
                    this.sendMessageCalendar(this.replyMarkupObject(this.createNavigationKeyboard(this.checkLanguage(msg.chat.id), now)), msg);
                }
            }
        } else {
            if (this.options.stop_date !== false) {
                if (new Date(this.options.stop_date) < now) {
                    this.sendMessageCalendar(this.replyMarkupObject(this.createNavigationKeyboard(this.checkLanguage(msg.chat.id), new Date(dayjs(this.options.stop_date).format("YYYY-MM-01")))), msg);
                } else {
                    this.sendMessageCalendar(this.replyMarkupObject(this.createNavigationKeyboard(this.checkLanguage(msg.chat.id), now)), msg);
                }
            } else {
                this.sendMessageCalendar(this.replyMarkupObject(this.createNavigationKeyboard(this.checkLanguage(msg.chat.id), now)), msg);
            }
        }
    }
    createStartTimeSelector(msg) {
        this.sendMessageTime(this.replyMarkupObject(this.createTimeSelector(this.checkLanguage(msg.chat.id))), msg);
    }
    clickButtonCalendar(query) {
        if (query.data == ' ') {
            return -1;
        }
        var code = query.data.split('_');
        var date;
        var res = -1;
        if (code[0] == 'n') {
            switch (code[2]) {
                case '+++':
                    date = new Date(code[1]);
                    date.setFullYear(date.getFullYear() + this.options.skip_years);
                    this.editMessageReplyMarkupCalendar(date, query);
                    break;
                case '---':
                    date = new Date(code[1]);
                    date.setFullYear(date.getFullYear() - this.options.skip_years);
                    this.editMessageReplyMarkupCalendar(date, query);
                    break;
                case '++':
                    date = new Date(code[1]);
                    date.setFullYear(date.getFullYear() + 1);
                    this.editMessageReplyMarkupCalendar(date, query);
                    break;
                case '--':
                    date = new Date(code[1]);
                    date.setFullYear(date.getFullYear() - 1);
                    this.editMessageReplyMarkupCalendar(date, query);
                    break;
                case '+':
                    date = new Date(code[1]);
                    if (date.getMonth() + 1 == 12) {
                        date.setFullYear(date.getFullYear() + 1);
                        date.setMonth(0);
                    } else {
                        date.setMonth(date.getMonth() + 1);
                    }
                    this.editMessageReplyMarkupCalendar(date, query);
                    break;
                case '-':
                    date = new Date(code[1]);
                    if (date.getMonth() - 1 == -1) {
                        date.setFullYear(date.getFullYear() - 1);
                        date.setMonth(11);
                    } else {
                        date.setMonth(date.getMonth() - 1);
                    }
                    this.editMessageReplyMarkupCalendar(date, query);
                    break;
                case '0':
                    if (this.options.close_calendar === true && this.options.time_selector_mod === false) {
                        this.deleteMessage(query);
                        this.chats.delete(query.message.chat.id);
                    }
                    if (this.options.time_selector_mod === true) {
                        this.editMessageReplyMarkupTime(dayjs(code[1]).format("YYYY-MM-DD HH:mm"), query, true);
                    }
                    else {
                        require('dayjs/locale/' + this.checkLanguage(query.message.chat.id));
                        res = dayjs(code[1]).locale(this.checkLanguage(query.message.chat.id)).format(this.options.date_format);
                    }
            }
        } else if (code[0] == 't') {
            switch (code[2]) {
                case 'back':
                    date = new Date(code[1]);
                    date.setDate(1);
                    this.editMessageReplyMarkupCalendar(date, query);
                    break;
                case '1+':
                    this.editMessageReplyMarkupTime(dayjs(code[1]), query, true);
                    break;
                case '1-':
                    date = dayjs(code[1]).subtract(16 * this.options.time_step.slice(0, -1), this.options.time_step.slice(-1));
                    this.editMessageReplyMarkupTime(date, query, true);
                    break;
                case '0+':
                    this.editMessageReplyMarkupTime(dayjs(code[1]), query, false);
                    break;
                case '0-':
                    date = dayjs(code[1]).subtract(16 * this.options.time_step.slice(0, -1), this.options.time_step.slice(-1));
                    this.editMessageReplyMarkupTime(date, query, false);
                    break;
                case '0':
                    if (this.options.close_calendar === true) {
                        this.deleteMessage(query);
                        this.chats.delete(query.message.chat.id);
                    }
                    require('dayjs/locale/' + this.checkLanguage(query.message.chat.id));
                    res = dayjs(code[1]).locale(this.checkLanguage(query.message.chat.id)).format(this.options.date_format);
            }
        } else if (code[0] == 'l') {
            switch (code[2]) {
                case 'calendar':
                    this.user_lang.set(query.message.chat.id, code[1]);
                    this.deleteMessage(query);
                    this.createStartCalendar(query.message);
                    break;
                case 'timeselector':
                    this.user_lang.set(query.message.chat.id, code[1]);
                    this.deleteMessage(query);
                    this.createStartTimeSelector(query.message);
            }
        }
        return res;
    }
    changeLang(lang) {
        this.options.language = lang;
    }
}