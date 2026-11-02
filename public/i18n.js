// All visible text in the three languages. {placeholders} are filled in by app.js.
// Keys used with data-i18n-html may contain <i>…</i> for the italic serif accents.
window.I18N = {
  pt: {
    locale: 'pt-BR',
    'nav.story': 'Nossa história', 'nav.day': 'O grande dia', 'nav.gifts': 'Presentes', 'nav.rsvp': 'Confirmar presença',

    'intro.to': 'Para', 'intro.guest': 'você', 'intro.hint': 'Toque para abrir', 'intro.skip': 'Pular',
    'intro.letter': 'Temos a alegria de convidar você para o nosso casamento',

    'hero.kicker': 'Vamos nos casar', 'hero.greeting': '{name}, este convite é para vocês',

    'intro.label': 'O convite',
    'intro.statement': 'Depois de muitos cafés, algumas viagens e um pedido de joelhos, decidimos dizer sim. E a festa só fica completa com você lá.',
    'count.label': 'Faltam', 'count.days': 'dias', 'count.hours': 'horas', 'count.minutes': 'minutos', 'count.seconds': 'segundos',
    'calendar.save': 'Salvar na agenda', 'calendar.title': 'Casamento {couple}',

    'story.label': 'Nossa história', 'story.title': 'Um capítulo de cada vez',
    'story.1.title': 'O primeiro encontro', 'story.1.text': 'Um amigo em comum, uma mesa de canto e uma conversa que durou até fecharem as portas.',
    'story.2.title': 'A primeira viagem', 'story.2.text': 'Descobrimos que viajamos bem juntos — exceto na hora de decidir quem fica com a janela.',
    'story.3.title': 'O pedido', 'story.3.text': 'Joelho no chão, voz tremendo e um "sim" antes mesmo da pergunta terminar.',

    'day.label': 'O grande dia', 'day.title': '{day}, <i>em Formosa</i>',
    'day.ceremony': 'Cerimônia', 'day.reception': 'Recepção', 'day.map': 'Abrir no mapa', 'day.dress': 'Traje',

    'gifts.label': 'Lista de presentes', 'gifts.title': 'Próxima parada: <i>México</i>',
    'gifts.lead': 'Logo depois do casamento vamos morar no México, e não teremos como levar presentes na mala. Por isso, qualquer contribuição — por Pix ou cartão — vai nos ajudar muito neste começo de vida juntos. Escolha um mimo abaixo ou um valor livre.',
    'gifts.give': 'Presentear', 'tag.popular': 'Mais pedido', 'tag.cheap': 'Barato e útil',
    'custom.title': 'Valor <i>livre</i>', 'custom.text': 'Prefere escolher o valor? Qualquer quantia ajuda.', 'custom.cta': 'Escolher valor',

    'simple.label': 'Presentes', 'simple.title': 'Um presente para o nosso <i>novo começo</i>',
    'simple.text': 'Logo depois do casamento vamos morar no México, e não teremos como levar presentes na mala. Se quiser nos presentear, qualquer valor ajuda muito neste começo de vida — por Pix ou cartão, em um minuto.',
    'simple.cta': 'Presentear os noivos', 'simple.note': 'Pix ou cartão · seguro e rápido',
    'donate.couple': 'Presente para os noivos', 'donate.coupleText': 'Para o nosso começo de vida no México. Obrigado de coração!', 'donate.other': 'Outro valor',
    'donate.custom': 'Presente com valor livre', 'donate.amount': 'Valor do presente', 'donate.qty': 'Quantidade',
    'donate.name': 'Seu nome', 'donate.namePh': 'Para sabermos quem agradecer',
    'donate.message': 'Recadinho (opcional)', 'donate.messagePh': 'A gente ama ler 💛',
    'donate.pix': 'Pagar com Pix', 'donate.card': 'Pagar com cartão', 'donate.total': 'Total',
    'donate.pixNote': 'Pix: na hora e sem taxas', 'donate.unavailable': 'Pagamentos ainda não estão ativos. Volte em breve!',
    'donate.loading': 'Um instante…', 'donate.amountError': 'Escolha um valor entre {min} e {max}.',
    'pix.title': 'Pague com Pix', 'pix.hint': 'Abra o app do seu banco, escolha Pix → Ler QR code, ou copie o código abaixo.',
    'pix.copy': 'Copiar código', 'pix.copied': 'Código copiado! Agora é só colar no app do banco.', 'pix.done': 'Já fiz o Pix', 'pix.back': 'Voltar',

    'rsvp.label': 'Confirmação de presença', 'rsvp.reserved': 'Reservamos {seats} para vocês. Responda até {deadline}.',
    'rsvp.yes': 'Confirmar presença', 'rsvp.no': 'Não poderei ir',
    'rsvp.yesTitle': 'Presença <i>confirmada!</i>', 'rsvp.yesText1': 'Te esperamos no dia {day}. Vai ser lindo!', 'rsvp.yesTextN': 'Esperamos vocês {n} no dia {day}. Vai ser lindo!',
    'rsvp.noTitle': 'Que pena! <i>Obrigado por avisar.</i>', 'rsvp.noText': 'Vamos sentir sua falta. Se quiser, ainda dá para mandar um mimo pela lista de presentes.',
    'rsvp.change': 'Mudar resposta', 'rsvp.seeGifts': 'Ver lista de presentes',
    'rsvp.nolinkTitle': 'Use o seu <i>link pessoal</i>', 'rsvp.nolinkText': 'Cada convite tem um link só seu, que enviamos pelo WhatsApp. É por ele que você confirma em um toque.',
    'rsvp.nolinkCta': 'Não achei meu link', 'rsvp.helpMsg': 'Oi! Não achei meu link de confirmação do casamento de {couple}.',
    'rsvp.error': 'Não foi possível enviar. Tente de novo.',
    seat: 'lugar', seats: 'lugares',

    'footer.love': 'Feito com amor — e muitas planilhas', 'footer.top': 'Voltar ao topo', 'footer.reopen': 'Abrir o envelope de novo', 'footer.photos': 'Fotos: Unsplash',

    'thanks.label': 'Presente recebido', 'thanks.title': 'Muito <i>obrigado!</i>', 'thanks.titleName': 'Obrigado, <i>{name}</i>!',
    'thanks.text': 'Seu presente chegou com todo o carinho. Prometemos usar com sabedoria (ou quase).',
    'thanks.pixText': 'Assim que o Pix cair, a gente comemora. Se quiser, mande um aviso para sabermos que foi você!',
    'thanks.whatsapp': 'Avisar os noivos no WhatsApp', 'thanks.back': 'Voltar ao convite',
    'thanks.waMsg': '🎁 Acabei de enviar um presente de casamento!',
  },

  en: {
    locale: 'en-US',
    'nav.story': 'Our story', 'nav.day': 'The day', 'nav.gifts': 'Gifts', 'nav.rsvp': 'RSVP',

    'intro.to': 'For', 'intro.guest': 'you', 'intro.hint': 'Tap to open', 'intro.skip': 'Skip',
    'intro.letter': 'We joyfully invite you to celebrate our wedding',

    'hero.kicker': "We're getting married", 'hero.greeting': '{name}, this invitation is for you',

    'intro.label': 'The invitation',
    'intro.statement': 'After many coffees, a few trips and one proposal on bended knee, we decided to say yes. And the party is only complete with you there.',
    'count.label': 'Countdown', 'count.days': 'days', 'count.hours': 'hours', 'count.minutes': 'minutes', 'count.seconds': 'seconds',
    'calendar.save': 'Add to calendar', 'calendar.title': "{couple}'s wedding",

    'story.label': 'Our story', 'story.title': 'One chapter at a time',
    'story.1.title': 'The first date', 'story.1.text': 'A mutual friend, a corner table and a conversation that lasted until they closed the doors.',
    'story.2.title': 'The first trip', 'story.2.text': 'We found out we travel well together — except when deciding who gets the window seat.',
    'story.3.title': 'The proposal', 'story.3.text': 'One knee down, a shaky voice and a "yes" before the question was even finished.',

    'day.label': 'The big day', 'day.title': '{day}, <i>in Formosa</i>',
    'day.ceremony': 'Ceremony', 'day.reception': 'Reception', 'day.map': 'Open in maps', 'day.dress': 'Dress code',

    'gifts.label': 'Gift registry', 'gifts.title': 'Next stop: <i>Mexico</i>',
    'gifts.lead': "Right after the wedding we're moving to Mexico, and there's no way to take gifts with us. Any contribution — by Pix or card — will help us a lot as we start our life together. Pick a gift below or choose any amount.",
    'gifts.give': 'Give', 'tag.popular': 'Most loved', 'tag.cheap': 'Small & useful',
    'custom.title': 'Any <i>amount</i>', 'custom.text': 'Prefer to choose the amount? Every bit helps.', 'custom.cta': 'Choose amount',

    'simple.label': 'Gifts', 'simple.title': 'A gift for our <i>new beginning</i>',
    'simple.text': "Right after the wedding we're moving to Mexico, and there's no way to take gifts with us. If you'd like to give us something, any amount helps a lot as we start our life together — by Pix or card, in a minute.",
    'simple.cta': 'Send a gift', 'simple.note': 'Pix or card · safe and quick',
    'donate.couple': 'A gift for the couple', 'donate.coupleText': 'For our new life in Mexico. Thank you from the bottom of our hearts!', 'donate.other': 'Other amount',
    'donate.custom': 'Gift (custom amount)', 'donate.amount': 'Gift amount', 'donate.qty': 'Quantity',
    'donate.name': 'Your name', 'donate.namePh': 'So we know who to thank',
    'donate.message': 'A note (optional)', 'donate.messagePh': 'We love reading them 💛',
    'donate.pix': 'Pay with Pix', 'donate.card': 'Pay by card', 'donate.total': 'Total',
    'donate.pixNote': 'Pix is the Brazilian instant transfer', 'donate.unavailable': 'Payments are not active yet. Please come back soon!',
    'donate.loading': 'One moment…', 'donate.amountError': 'Choose an amount between {min} and {max}.',
    'pix.title': 'Pay with Pix', 'pix.hint': 'Open your bank app, choose Pix → Scan QR code, or copy the code below.',
    'pix.copy': 'Copy code', 'pix.copied': 'Code copied! Paste it in your bank app.', 'pix.done': "I've sent the Pix", 'pix.back': 'Back',

    'rsvp.label': 'RSVP', 'rsvp.reserved': 'We have reserved {seats} for you. Please reply by {deadline}.',
    'rsvp.yes': "Yes, I'll be there", 'rsvp.no': "Sorry, I can't make it",
    'rsvp.yesTitle': "You're <i>confirmed!</i>", 'rsvp.yesText1': 'See you on {day}. It will be beautiful!', 'rsvp.yesTextN': 'We look forward to seeing all {n} of you on {day}!',
    'rsvp.noTitle': "We'll miss you. <i>Thanks for letting us know.</i>", 'rsvp.noText': 'If you like, you can still send us a little something from the gift registry.',
    'rsvp.change': 'Change my answer', 'rsvp.seeGifts': 'See the gift registry',
    'rsvp.nolinkTitle': 'Use your <i>personal link</i>', 'rsvp.nolinkText': 'Every invitation has its own link, which we sent you on WhatsApp. That is where you confirm, in one tap.',
    'rsvp.nolinkCta': "I can't find my link", 'rsvp.helpMsg': "Hi! I can't find my RSVP link for {couple}'s wedding.",
    'rsvp.error': 'Something went wrong. Please try again.',
    seat: 'seat', seats: 'seats',

    'footer.love': 'Made with love — and many spreadsheets', 'footer.top': 'Back to top', 'footer.reopen': 'Open the envelope again', 'footer.photos': 'Photos: Unsplash',

    'thanks.label': 'Gift received', 'thanks.title': 'Thank you <i>so much!</i>', 'thanks.titleName': 'Thank you, <i>{name}</i>!',
    'thanks.text': 'Your gift arrived with all its love. We promise to spend it wisely (mostly).',
    'thanks.pixText': "As soon as the Pix arrives we'll celebrate. Feel free to send us a message so we know it was you!",
    'thanks.whatsapp': 'Message the couple on WhatsApp', 'thanks.back': 'Back to the invitation',
    'thanks.waMsg': '🎁 I just sent you a wedding gift!',
  },

  es: {
    locale: 'es-ES',
    'nav.story': 'Nuestra historia', 'nav.day': 'El gran día', 'nav.gifts': 'Regalos', 'nav.rsvp': 'Confirmar asistencia',

    'intro.to': 'Para', 'intro.guest': 'ti', 'intro.hint': 'Toca para abrir', 'intro.skip': 'Saltar',
    'intro.letter': 'Tenemos la alegría de invitarte a nuestra boda',

    'hero.kicker': 'Nos casamos', 'hero.greeting': '{name}, esta invitación es para ustedes',

    'intro.label': 'La invitación',
    'intro.statement': 'Después de muchos cafés, algunos viajes y una propuesta de rodillas, decidimos decir que sí. Y la fiesta solo está completa contigo.',
    'count.label': 'Faltan', 'count.days': 'días', 'count.hours': 'horas', 'count.minutes': 'minutos', 'count.seconds': 'segundos',
    'calendar.save': 'Guardar en el calendario', 'calendar.title': 'Boda de {couple}',

    'story.label': 'Nuestra historia', 'story.title': 'Un capítulo a la vez',
    'story.1.title': 'La primera cita', 'story.1.text': 'Un amigo en común, una mesa en la esquina y una conversación que duró hasta que cerraron.',
    'story.2.title': 'El primer viaje', 'story.2.text': 'Descubrimos que viajamos bien juntos — excepto a la hora de decidir quién va en la ventanilla.',
    'story.3.title': 'La propuesta', 'story.3.text': 'Rodilla en el suelo, voz temblorosa y un "sí" antes de terminar la pregunta.',

    'day.label': 'El gran día', 'day.title': '{day}, <i>en Formosa</i>',
    'day.ceremony': 'Ceremonia', 'day.reception': 'Recepción', 'day.map': 'Abrir en el mapa', 'day.dress': 'Código de vestimenta',

    'gifts.label': 'Lista de regalos', 'gifts.title': 'Próxima parada: <i>México</i>',
    'gifts.lead': 'Justo después de la boda nos mudamos a México y no podremos llevar regalos en la maleta. Cualquier aporte — por Pix o tarjeta — nos ayuda muchísimo en este comienzo de nuestra vida juntos. Elige un detalle abajo o un valor libre.',
    'gifts.give': 'Regalar', 'tag.popular': 'El más elegido', 'tag.cheap': 'Barato y útil',
    'custom.title': 'Valor <i>libre</i>', 'custom.text': '¿Prefieres elegir el valor? Todo ayuda.', 'custom.cta': 'Elegir valor',

    'simple.label': 'Regalos', 'simple.title': 'Un regalo para nuestro <i>nuevo comienzo</i>',
    'simple.text': 'Justo después de la boda nos mudamos a México y no podremos llevar regalos en la maleta. Si quieres hacernos un regalo, cualquier valor nos ayuda muchísimo en este comienzo — por Pix o tarjeta, en un minuto.',
    'simple.cta': 'Hacer un regalo', 'simple.note': 'Pix o tarjeta · seguro y rápido',
    'donate.couple': 'Regalo para los novios', 'donate.coupleText': 'Para nuestra nueva vida en México. ¡Gracias de corazón!', 'donate.other': 'Otro valor',
    'donate.custom': 'Regalo (valor libre)', 'donate.amount': 'Valor del regalo', 'donate.qty': 'Cantidad',
    'donate.name': 'Tu nombre', 'donate.namePh': 'Para saber a quién agradecer',
    'donate.message': 'Un mensaje (opcional)', 'donate.messagePh': 'Nos encanta leerlos 💛',
    'donate.pix': 'Pagar con Pix', 'donate.card': 'Pagar con tarjeta', 'donate.total': 'Total',
    'donate.pixNote': 'Pix es la transferencia instantánea de Brasil', 'donate.unavailable': 'Los pagos aún no están activos. ¡Vuelve pronto!',
    'donate.loading': 'Un momento…', 'donate.amountError': 'Elige un valor entre {min} y {max}.',
    'pix.title': 'Paga con Pix', 'pix.hint': 'Abre la app de tu banco, elige Pix → Leer código QR, o copia el código de abajo.',
    'pix.copy': 'Copiar código', 'pix.copied': '¡Código copiado! Pégalo en la app del banco.', 'pix.done': 'Ya hice el Pix', 'pix.back': 'Volver',

    'rsvp.label': 'Confirmación de asistencia', 'rsvp.reserved': 'Reservamos {seats} para ustedes. Responde antes del {deadline}.',
    'rsvp.yes': 'Confirmar asistencia', 'rsvp.no': 'No podré ir',
    'rsvp.yesTitle': '¡Asistencia <i>confirmada!</i>', 'rsvp.yesText1': 'Te esperamos el {day}. ¡Va a ser precioso!', 'rsvp.yesTextN': '¡Los esperamos a los {n} el {day}!',
    'rsvp.noTitle': '¡Qué pena! <i>Gracias por avisar.</i>', 'rsvp.noText': 'Te vamos a extrañar. Si quieres, todavía puedes enviarnos un detalle desde la lista de regalos.',
    'rsvp.change': 'Cambiar respuesta', 'rsvp.seeGifts': 'Ver la lista de regalos',
    'rsvp.nolinkTitle': 'Usa tu <i>link personal</i>', 'rsvp.nolinkText': 'Cada invitación tiene su propio link, que te enviamos por WhatsApp. Ahí confirmas con un toque.',
    'rsvp.nolinkCta': 'No encuentro mi link', 'rsvp.helpMsg': '¡Hola! No encuentro mi link de confirmación para la boda de {couple}.',
    'rsvp.error': 'No se pudo enviar. Inténtalo de nuevo.',
    seat: 'lugar', seats: 'lugares',

    'footer.love': 'Hecho con amor — y muchas planillas', 'footer.top': 'Volver arriba', 'footer.reopen': 'Abrir el sobre otra vez', 'footer.photos': 'Fotos: Unsplash',

    'thanks.label': 'Regalo recibido', 'thanks.title': '¡Muchas <i>gracias!</i>', 'thanks.titleName': '¡Gracias, <i>{name}</i>!',
    'thanks.text': 'Tu regalo llegó con todo el cariño. Prometemos usarlo con sabiduría (o casi).',
    'thanks.pixText': 'En cuanto llegue el Pix lo celebramos. ¡Si quieres, avísanos para saber que fuiste tú!',
    'thanks.whatsapp': 'Avisar a los novios por WhatsApp', 'thanks.back': 'Volver a la invitación',
    'thanks.waMsg': '🎁 ¡Acabo de enviarles un regalo de boda!',
  },
};
