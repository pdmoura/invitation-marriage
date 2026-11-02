// All visible text in the three languages. {placeholders} are filled in by app.js.
// Story texts are placeholders written in the couple's voice: replace them with your own words.
window.I18N = {
  pt: {
    locale: 'pt-BR',
    'nav.day': 'O grande dia', 'nav.gifts': 'Presentes', 'nav.rsvp': 'Confirmar presença',

    'intro.to': 'Para', 'intro.guest': 'você', 'intro.hint': 'Toque no envelope para abrir', 'intro.hint2': 'Toque de novo para ver o convite', 'intro.skip': 'Pular',
    'intro.letter': 'Temos a alegria de convidar você para o nosso casamento',

    'hero.greeting': 'Para {name}', 'hero.lead': 'vão se casar e querem você lá.',
    'hero.where': 'Cerimônia às 16h · Formosa, Goiás', 'hero.count': 'Faltam {n} dias',
    'action.rsvp': 'Confirmar presença', 'action.gifts': 'Lista de presentes', 'action.place': 'Local da cerimônia',

    'letter.title': 'Uma carta para você',
    'letter.p1': 'Tudo começou num café em 2019, com um amigo em comum e uma conversa que durou até fecharem as portas. Depois vieram as viagens, as mudanças e um pedido de joelhos que ninguém esqueceu.',
    'letter.p2': 'No dia 17 de julho dizemos sim em Formosa, Goiás, em plena estação dos ipês. Logo depois começamos uma vida nova no México.',
    'letter.p3': 'Antes de partir, queremos estar perto de quem fez parte dessa história. Por isso este convite é só seu: confirme em um toque e venha comemorar com a gente.',
    'letter.deadline': 'Responda até {deadline}',

    'calendar.save': 'Salvar na agenda', 'calendar.title': 'Casamento {couple}',

    'day.title': '{day}, em Formosa',
    'day.ceremony': 'Cerimônia', 'day.reception': 'Recepção', 'day.map': 'Abrir no mapa',
    'day.dressShort': 'Traje', 'day.dress': 'Esporte fino',
    'day.travelTitle': 'Como chegar', 'day.travelText': 'Formosa fica a 80 km de Brasília, cerca de 1 hora de carro pela BR-020. O aeroporto mais próximo é o de Brasília (BSB).', 'day.route': 'Ver rota',
    'day.foot': 'Hospedagem e horários finais seguem por WhatsApp para quem confirmar.',

    'gifts.title': 'Próxima parada: México',
    'gifts.lead': 'Logo depois do casamento vamos morar no México e não teremos como levar presentes na mala. Qualquer contribuição, por Pix ou cartão, ajuda muito neste começo.',
    'gifts.give': 'Presentear', 'tag.popular': 'Mais pedido', 'tag.cheap': 'Barato e útil',
    'custom.title': 'Valor livre', 'custom.text': 'Você escolhe o valor. Para a nossa vida no México.',

    'simple.title': 'Um presente para o nosso novo começo',
    'simple.text': 'Logo depois do casamento vamos morar no México e não teremos como levar presentes. Se quiser nos presentear, qualquer valor ajuda muito — por Pix ou cartão, em um minuto.',
    'simple.cta': 'Presentear os noivos', 'simple.note': 'Pix ou cartão · seguro e rápido',

    'donate.couple': 'Presente para os noivos', 'donate.coupleText': 'Para o nosso começo de vida no México. Obrigado de coração!',
    'donate.custom': 'Presente com valor livre', 'donate.amount': 'Valor do presente', 'donate.other': 'Outro valor', 'donate.qty': 'Quantidade',
    'donate.name': 'Seu nome', 'donate.namePh': 'Para sabermos quem agradecer',
    'donate.message': 'Recadinho (opcional)', 'donate.messagePh': 'A gente ama ler',
    'donate.pix': 'Pagar com Pix', 'donate.card': 'Pagar com cartão', 'donate.total': 'Total',
    'donate.pixNote': 'Pix: na hora e sem taxas', 'donate.unavailable': 'Pagamentos ainda não estão ativos. Volte em breve!',
    'donate.loading': 'Um instante…', 'donate.amountError': 'Escolha um valor entre {min} e {max}.',
    'pix.title': 'Pague com Pix', 'pix.hint': 'Abra o app do seu banco, escolha Pix → Ler QR code, ou copie o código abaixo.',
    'pix.copy': 'Copiar', 'pix.copied': 'Código copiado! Agora é só colar no app do banco.', 'pix.done': 'Já fiz o Pix', 'pix.back': 'Voltar',

    'rsvp.aside': 'Um toque basta. Reservamos {seats} para vocês. Responda até {deadline}.',
    'rsvp.asideNoLink': 'Cada convite tem um link só seu, enviado pelo WhatsApp. É por ele que você confirma.',
    'rsvp.reserved': 'Reservamos {seats} para vocês.',
    'rsvp.yes': 'Confirmar presença', 'rsvp.no': 'Não poderei ir',
    'rsvp.yesTitle': 'Presença confirmada', 'rsvp.yesText1': 'Te esperamos no dia {day}. Vai ser lindo!', 'rsvp.yesTextN': 'Esperamos vocês {n} no dia {day}. Vai ser lindo!',
    'rsvp.noTitle': 'Que pena', 'rsvp.noText': 'Obrigado por avisar. Vamos sentir sua falta — e, se quiser, ainda dá para mandar um mimo.',
    'rsvp.change': 'Mudar resposta', 'rsvp.seeGifts': 'Ver lista de presentes',
    'rsvp.nolinkTitle': 'Use o seu link pessoal', 'rsvp.nolinkText': 'Não achou o link? Fale com a gente que reenviamos.',
    'rsvp.nolinkCta': 'Pedir meu link no WhatsApp', 'rsvp.helpMsg': 'Oi! Não achei meu link de confirmação do casamento de {couple}.',
    'rsvp.error': 'Não foi possível enviar. Tente de novo.',
    seat: 'lugar', seats: 'lugares',

    'footer.title': 'Até dia 17', 'footer.text': 'Qualquer dúvida sobre o dia, é só chamar no WhatsApp. Mal podemos esperar para te ver em Formosa.',
    'footer.reopen': 'Abrir o envelope de novo', 'footer.photos': 'Fotos: Unsplash',

    'thanks.label': 'Presente recebido', 'thanks.title': 'Muito obrigado!', 'thanks.titleName': 'Obrigado, {name}!',
    'thanks.text': 'Seu presente chegou com todo o carinho. Prometemos usar com sabedoria (ou quase).',
    'thanks.pixText': 'Assim que o Pix cair, a gente comemora. Se quiser, mande um aviso para sabermos que foi você!',
    'thanks.whatsapp': 'Avisar os noivos no WhatsApp', 'thanks.back': 'Voltar ao convite',
    'thanks.waMsg': '🎁 Acabei de enviar um presente de casamento!',
  },

  en: {
    locale: 'en-US',
    'nav.day': 'The day', 'nav.gifts': 'Gifts', 'nav.rsvp': 'RSVP',

    'intro.to': 'For', 'intro.guest': 'you', 'intro.hint': 'Tap the envelope to open it', 'intro.hint2': 'Tap again to see the invitation', 'intro.skip': 'Skip',
    'intro.letter': 'We joyfully invite you to celebrate our wedding',

    'hero.greeting': 'For {name}', 'hero.lead': 'are getting married and want you there.',
    'hero.where': 'Ceremony at 4 pm · Formosa, Goiás, Brazil', 'hero.count': '{n} days to go',
    'action.rsvp': 'RSVP', 'action.gifts': 'Gift registry', 'action.place': 'Location',

    'letter.title': 'A letter for you',
    'letter.p1': 'It all started at a café in 2019, with a mutual friend and a conversation that lasted until they closed the doors. Then came the trips, the moves and a proposal on one knee nobody forgot.',
    'letter.p2': 'On 17 July we say yes in Formosa, Goiás, right in the season when the ipê trees bloom. Soon after, we start a new life in Mexico.',
    'letter.p3': 'Before we go, we want to be close to everyone who is part of this story. That is why this invitation is yours alone: reply in one tap and come celebrate with us.',
    'letter.deadline': 'Please reply by {deadline}',

    'calendar.save': 'Add to calendar', 'calendar.title': "{couple}'s wedding",

    'day.title': '{day}, in Formosa',
    'day.ceremony': 'Ceremony', 'day.reception': 'Reception', 'day.map': 'Open in maps',
    'day.dressShort': 'Dress', 'day.dress': 'Smart casual',
    'day.travelTitle': 'Getting there', 'day.travelText': 'Formosa is 80 km from Brasília, about an hour by car on the BR-020. The nearest airport is Brasília (BSB).', 'day.route': 'See the route',
    'day.foot': 'Accommodation tips and final times go out on WhatsApp to everyone who replies.',

    'gifts.title': 'Next stop: Mexico',
    'gifts.lead': "Right after the wedding we're moving to Mexico, and we can't take gifts with us. Any contribution, by Pix or card, helps a lot as we start out.",
    'gifts.give': 'Give', 'tag.popular': 'Most loved', 'tag.cheap': 'Small & useful',
    'custom.title': 'Any amount', 'custom.text': 'You choose the amount. For our life in Mexico.',

    'simple.title': 'A gift for our new beginning',
    'simple.text': "Right after the wedding we're moving to Mexico and can't take gifts with us. If you'd like to give us something, any amount helps a lot — by Pix or card, in a minute.",
    'simple.cta': 'Send a gift', 'simple.note': 'Pix or card · safe and quick',

    'donate.couple': 'A gift for the couple', 'donate.coupleText': 'For our new life in Mexico. Thank you from the heart!',
    'donate.custom': 'Gift (any amount)', 'donate.amount': 'Gift amount', 'donate.other': 'Other amount', 'donate.qty': 'Quantity',
    'donate.name': 'Your name', 'donate.namePh': 'So we know who to thank',
    'donate.message': 'A note (optional)', 'donate.messagePh': 'We love reading them',
    'donate.pix': 'Pay with Pix', 'donate.card': 'Pay by card', 'donate.total': 'Total',
    'donate.pixNote': 'Pix is the Brazilian instant transfer', 'donate.unavailable': 'Payments are not active yet. Please come back soon!',
    'donate.loading': 'One moment…', 'donate.amountError': 'Choose an amount between {min} and {max}.',
    'pix.title': 'Pay with Pix', 'pix.hint': 'Open your bank app, choose Pix → Scan QR code, or copy the code below.',
    'pix.copy': 'Copy', 'pix.copied': 'Code copied! Paste it in your bank app.', 'pix.done': "I've sent the Pix", 'pix.back': 'Back',

    'rsvp.aside': 'One tap is all it takes. We saved {seats} for you. Please reply by {deadline}.',
    'rsvp.asideNoLink': 'Every invitation has its own link, sent on WhatsApp. That is where you reply.',
    'rsvp.reserved': 'We saved {seats} for you.',
    'rsvp.yes': "Yes, we'll be there", 'rsvp.no': "Sorry, we can't make it",
    'rsvp.yesTitle': "You're confirmed", 'rsvp.yesText1': 'See you on {day}. It will be beautiful!', 'rsvp.yesTextN': 'We look forward to seeing all {n} of you on {day}!',
    'rsvp.noTitle': "We'll miss you", 'rsvp.noText': 'Thanks for letting us know. If you like, you can still send us a little something.',
    'rsvp.change': 'Change my answer', 'rsvp.seeGifts': 'See the gift registry',
    'rsvp.nolinkTitle': 'Use your personal link', 'rsvp.nolinkText': "Can't find it? Message us and we'll send it again.",
    'rsvp.nolinkCta': 'Ask for my link on WhatsApp', 'rsvp.helpMsg': "Hi! I can't find my RSVP link for {couple}'s wedding.",
    'rsvp.error': 'Something went wrong. Please try again.',
    seat: 'seat', seats: 'seats',

    'footer.title': 'See you on the 17th', 'footer.text': 'Any questions about the day, just message us on WhatsApp. We can’t wait to see you in Formosa.',
    'footer.reopen': 'Open the envelope again', 'footer.photos': 'Photos: Unsplash',

    'thanks.label': 'Gift received', 'thanks.title': 'Thank you so much!', 'thanks.titleName': 'Thank you, {name}!',
    'thanks.text': 'Your gift arrived with all its love. We promise to spend it wisely (mostly).',
    'thanks.pixText': "As soon as the Pix arrives we'll celebrate. Feel free to message us so we know it was you!",
    'thanks.whatsapp': 'Message the couple on WhatsApp', 'thanks.back': 'Back to the invitation',
    'thanks.waMsg': '🎁 I just sent you a wedding gift!',
  },

  es: {
    locale: 'es-ES',
    'nav.day': 'El gran día', 'nav.gifts': 'Regalos', 'nav.rsvp': 'Confirmar asistencia',

    'intro.to': 'Para', 'intro.guest': 'ti', 'intro.hint': 'Toca el sobre para abrirlo', 'intro.hint2': 'Toca otra vez para ver la invitación', 'intro.skip': 'Saltar',
    'intro.letter': 'Tenemos la alegría de invitarte a nuestra boda',

    'hero.greeting': 'Para {name}', 'hero.lead': 'se casan y quieren que estés ahí.',
    'hero.where': 'Ceremonia a las 16 h · Formosa, Goiás, Brasil', 'hero.count': 'Faltan {n} días',
    'action.rsvp': 'Confirmar asistencia', 'action.gifts': 'Lista de regalos', 'action.place': 'Ubicación',

    'letter.title': 'Una carta para ti',
    'letter.p1': 'Todo empezó en un café en 2019, con un amigo en común y una conversación que duró hasta que cerraron. Después vinieron los viajes, las mudanzas y una propuesta de rodillas que nadie olvidó.',
    'letter.p2': 'El 17 de julio decimos que sí en Formosa, Goiás, en plena temporada de los ipês en flor. Poco después empezamos una vida nueva en México.',
    'letter.p3': 'Antes de partir queremos estar cerca de quienes forman parte de esta historia. Por eso esta invitación es solo tuya: confirma con un toque y ven a celebrar con nosotros.',
    'letter.deadline': 'Responde antes del {deadline}',

    'calendar.save': 'Guardar en el calendario', 'calendar.title': 'Boda de {couple}',

    'day.title': '{day}, en Formosa',
    'day.ceremony': 'Ceremonia', 'day.reception': 'Recepción', 'day.map': 'Abrir en el mapa',
    'day.dressShort': 'Vestimenta', 'day.dress': 'Formal ligero',
    'day.travelTitle': 'Cómo llegar', 'day.travelText': 'Formosa está a 80 km de Brasilia, cerca de una hora en coche por la BR-020. El aeropuerto más cercano es el de Brasilia (BSB).', 'day.route': 'Ver la ruta',
    'day.foot': 'El alojamiento y los horarios finales llegan por WhatsApp a quien confirme.',

    'gifts.title': 'Próxima parada: México',
    'gifts.lead': 'Justo después de la boda nos mudamos a México y no podremos llevar regalos en la maleta. Cualquier aporte, por Pix o tarjeta, nos ayuda muchísimo en este comienzo.',
    'gifts.give': 'Regalar', 'tag.popular': 'El más elegido', 'tag.cheap': 'Barato y útil',
    'custom.title': 'Valor libre', 'custom.text': 'Tú eliges el valor. Para nuestra vida en México.',

    'simple.title': 'Un regalo para nuestro nuevo comienzo',
    'simple.text': 'Justo después de la boda nos mudamos a México y no podremos llevar regalos. Si quieres hacernos un regalo, cualquier valor nos ayuda muchísimo — por Pix o tarjeta, en un minuto.',
    'simple.cta': 'Hacer un regalo', 'simple.note': 'Pix o tarjeta · seguro y rápido',

    'donate.couple': 'Regalo para los novios', 'donate.coupleText': 'Para nuestra nueva vida en México. ¡Gracias de corazón!',
    'donate.custom': 'Regalo (valor libre)', 'donate.amount': 'Valor del regalo', 'donate.other': 'Otro valor', 'donate.qty': 'Cantidad',
    'donate.name': 'Tu nombre', 'donate.namePh': 'Para saber a quién agradecer',
    'donate.message': 'Un mensaje (opcional)', 'donate.messagePh': 'Nos encanta leerlos',
    'donate.pix': 'Pagar con Pix', 'donate.card': 'Pagar con tarjeta', 'donate.total': 'Total',
    'donate.pixNote': 'Pix es la transferencia instantánea de Brasil', 'donate.unavailable': 'Los pagos aún no están activos. ¡Vuelve pronto!',
    'donate.loading': 'Un momento…', 'donate.amountError': 'Elige un valor entre {min} y {max}.',
    'pix.title': 'Paga con Pix', 'pix.hint': 'Abre la app de tu banco, elige Pix → Leer código QR, o copia el código de abajo.',
    'pix.copy': 'Copiar', 'pix.copied': '¡Código copiado! Pégalo en la app del banco.', 'pix.done': 'Ya hice el Pix', 'pix.back': 'Volver',

    'rsvp.aside': 'Basta un toque. Reservamos {seats} para ustedes. Responde antes del {deadline}.',
    'rsvp.asideNoLink': 'Cada invitación tiene su propio link, enviado por WhatsApp. Ahí confirmas.',
    'rsvp.reserved': 'Reservamos {seats} para ustedes.',
    'rsvp.yes': 'Confirmar asistencia', 'rsvp.no': 'No podremos ir',
    'rsvp.yesTitle': 'Asistencia confirmada', 'rsvp.yesText1': 'Te esperamos el {day}. ¡Va a ser precioso!', 'rsvp.yesTextN': '¡Los esperamos a los {n} el {day}!',
    'rsvp.noTitle': 'Qué pena', 'rsvp.noText': 'Gracias por avisar. Si quieres, todavía puedes enviarnos un detalle.',
    'rsvp.change': 'Cambiar respuesta', 'rsvp.seeGifts': 'Ver la lista de regalos',
    'rsvp.nolinkTitle': 'Usa tu link personal', 'rsvp.nolinkText': '¿No lo encuentras? Escríbenos y te lo reenviamos.',
    'rsvp.nolinkCta': 'Pedir mi link por WhatsApp', 'rsvp.helpMsg': '¡Hola! No encuentro mi link de confirmación para la boda de {couple}.',
    'rsvp.error': 'No se pudo enviar. Inténtalo de nuevo.',
    seat: 'lugar', seats: 'lugares',

    'footer.title': 'Nos vemos el 17', 'footer.text': 'Cualquier duda sobre el día, escríbenos por WhatsApp. Tenemos muchas ganas de verte en Formosa.',
    'footer.reopen': 'Abrir el sobre otra vez', 'footer.photos': 'Fotos: Unsplash',

    'thanks.label': 'Regalo recibido', 'thanks.title': '¡Muchas gracias!', 'thanks.titleName': '¡Gracias, {name}!',
    'thanks.text': 'Tu regalo llegó con todo el cariño. Prometemos usarlo con sabiduría (o casi).',
    'thanks.pixText': 'En cuanto llegue el Pix lo celebramos. ¡Si quieres, avísanos para saber que fuiste tú!',
    'thanks.whatsapp': 'Avisar a los novios por WhatsApp', 'thanks.back': 'Volver a la invitación',
    'thanks.waMsg': '🎁 ¡Acabo de enviarles un regalo de boda!',
  },
};
