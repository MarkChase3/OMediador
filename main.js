const { Telegraf, Markup, Telegram } = require('telegraf')
const bot = new Telegraf(process.env.BOT_KEY)

let chatsP = [[92, 0], [256, 1], [258, 2]]
let chatsR = [[1310, 0], [1310, 1], [1310, 2]]
let perguntas = []
let n = process.argv[2]

function responder(ctx) {
    let txt = ctx.update.message.reply_to_message.photo ? ctx.update.message.reply_to_message.caption : ctx.update.message.reply_to_message.text
    console.log(txt)
    resend(ctx, '<blockquote>Pergunta ' + (ctx.update.message.reply_to_message.caption ? ctx.update.message.reply_to_message.caption : ctx.update.message.reply_to_message.text).split('\n')[0].split(' ')[1] + ' por ' + txt.split('\n')[0].split(' ').slice(3).join(' ') + ' - Resolução</blockquote>\n\n' + ctx.update.message.text, { reply_to_message_id: ctx.update.message.reply_to_message.message_id, ...Markup.inlineKeyboard([Markup.button.callback("Resolvido", "Vali")], { columns: 1 }).oneTime().resize() })
    ctx.deleteMessage()
}
function resend(ctx, capt, sett) {
    if (ctx.update.message.photo) {
        ctx.telegram.getFileLink(ctx.update.message.photo.slice(-1)[0].file_id).then(url => {
            ctx.telegram.sendPhoto(ctx.chat.id, { url: url.href }, {
                message_thread_id: ctx.update.message.message_thread_id,
                parse_mode: 'HTML',
                caption: capt,
                ...sett
            })
        })
        return
    }
    ctx.reply(capt, { parse_mode: 'HTML', ...sett })
}
bot.on('message', (ctx) => {
    console.debug(ctx.chat.id)
    if (ctx.update.message.photo) ctx.update.message.text = (ctx.update.message.caption ? ctx.update.message.caption : '.')
    if (!ctx.update.message.text) return;
    console.log(ctx.update)
    if (chatsP.map(e => e[0]).indexOf(ctx.update.message.message_thread_id) == -1) return;
    if (ctx.update.message.reply_to_message && ctx.update.message.reply_to_message.message_id != ctx.update.message.message_thread_id) {
        responder(ctx)
        return;
    }
    perguntas.push([ctx, n]);
    resend(ctx, '<blockquote>Pergunta #' + n + ' por ' + ctx.message.from.first_name + '</blockquote>\n\n' + ctx.update.message.text, Markup.inlineKeyboard([Markup.button.callback("Não era pergunta", "NAOP")], { columns: 1 }).oneTime().resize())
    ctx.deleteMessage()
    n++;
})
bot.action('NAOP', (ctx) => {
    let txt = ctx.update.callback_query.message.caption ? ctx.update.callback_query.message.caption : ctx.update.callback_query.message.text
    if (ctx.from.first_name == txt.split('\n')[0].split(' ').slice(3).join(' ')) {
        let txt = ctx.update.callback_query.message.caption ? ctx.update.callback_query.message.caption : ctx.update.callback_query.message.text
        ctx.update.message = ctx.update.callback_query.message
        ctx.deleteMessage()
        resend(ctx, 'Página 0\nQual pergunta você queria responder com:\n' + txt.split('\n').slice(2).join('\n'), {
            ...Markup.inlineKeyboard([...perguntas.slice(0, 3).map(e => Markup.button.callback(e[1], e[1])), Markup.button.callback("Não queria responder nada", "N"), ...(perguntas.length > 4 ? [Markup.button.callback(">", "+")] : [])], { columns: 3 }).oneTime().resize()
        })
    }
})
bot.action('N', (ctx) => {
    let txt = ctx.update.callback_query.message.caption ? ctx.update.callback_query.message.caption : ctx.update.callback_query.message.text
    ctx.deleteMessage()
    for (let i = 0; i < perguntas.length; i++) {
        if (perguntas[i][1] == +txt.split(' ')[1].slice(1)) {
            perguntas.splice(i, 1)
            break;
        }
    }
})
bot.action('+', (ctx) => {
    let txt = ctx.update.callback_query.message.caption ? ctx.update.callback_query.message.caption : ctx.update.callback_query.message.text
    ctx.deleteMessage()
    ctx.update.message = ctx.update.callback_query.message
    let page = (+txt.split('\n')[0].split(' ')[1]) + 1
    console.log(page)
    resend(ctx, 'Página ' + page + '\nQual pergunta você queria responder com:\n' + txt.split('\n').slice(2).join('\n'), {
        ...Markup.inlineKeyboard([...perguntas.slice(page * 3, page + 3).map(e => Markup.button.callback(e[1], e[1])), Markup.button.callback("<", "-"), Markup.button.callback("Não queria responder nada", "N"), ...(perguntas.length > (page + 1) * 3 + 1 ? [Markup.button.callback(">", "+")] : [])], { columns: 3 }).oneTime().resize()
    })

})
bot.action('-', (ctx) => {
    let txt = ctx.update.callback_query.message.caption ? ctx.update.callback_query.message.caption : ctx.update.callback_query.message.text
    ctx.deleteMessage()
    ctx.update.message = ctx.update.callback_query.message
    let page = (+txt.split('\n')[0].split(' ')[1]) - 1
    console.log(page)
    resend(ctx, 'Página ' + page + '\nQual pergunta você queria responder com:\n' + txt.split('\n').slice(2).join('\n'), {
        ...Markup.inlineKeyboard([...perguntas.slice(page * 3, page + 3).map(e => Markup.button.callback(e[1], e[1])), ...(page > 0 ? [Markup.button.callback("<", "-")] : []), Markup.button.callback("Não queria responder nada", "N"), Markup.button.callback(">", "+")], { columns: 3 }).oneTime().resize()
    })

})
bot.action('Vali', (ctx) => {
    if (!ctx.update.callback_query.message.reply_to_message) {
        ctx.deleteMessage()
        return;
    }
    let txt = ctx.update.callback_query.message.caption ? ctx.update.callback_query.message.caption : ctx.update.callback_query.message.text
    let allt = [ctx.update.callback_query.message.message_id, ctx.update.callback_query.message.reply_to_message.message_id]
    let msg = ctx.update.callback_query.message.reply_to_message;
    while (msg.reply_to_message) {
        allt.push(msg.reply_to_message.message_id)
        msg = msg.reply_to_message
    }
    allt.reverse()
    console.log(msg.message_thread_id)
    if (ctx.from.first_name == txt.split('\n')[0].split(' ').slice(3).join(' ').slice(0, -12))
        bot.telegram.copyMessages('-1002414229969', ctx.chat.id, allt, { message_thread_id: chatsR.filter(e => e[1] == chatsP.filter(e => e[0] == msg.message_thread_id)[0][1])[0][0] }).then(e => {
            bot.telegram.deleteMessages(ctx.chat.id, allt);
            for (let i = 0; i < perguntas.length; i++) {
                if (perguntas[i][1] == +txt.split(' ')[1].slice(1)) {
                    perguntas.splice(i, 1)
                    break;
                }
            }
        })
})
bot.launch()
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
