export interface Article {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  featured?: boolean;
  edition?: string;
  content: {
    lead?: string;
    authorBio?: string;
    sections: {
      heading?: string;
      paragraphs: string[];
      quote?: string;
      bulletPoints?: string[];
    }[];
  };
}

export const ARTICLES: Article[] = [
  {
    slug: "esta-nueva-empresa-se-encarga-de-toda-la-tecnologia-de-su-automotora",
    title: "Esta Nueva Empresa se Encarga de Toda la Tecnología de Su Automotora. Usted se Encarga de Vender",
    subtitle: "Un patrón que se repite en casi todas las automotoras de Uruguay y el costo real de no tener un sistema unificado de respuestas.",
    category: "Ventas & Mercado",
    author: "Mauricio Negrin",
    date: "15 de Agosto, 2026",
    readTime: "4 min de lectura",
    edition: "Especial Mercado Automotor",
    featured: true,
    image: "/article-illustration.png",
    content: {
      authorBio: "Mauricio Negrin es Ingeniero en Mecatrónica, vive en Colonia del Sacramento y es el fundador de n-sistemas.com, la empresa desarrolladora de n-autos.com.",
      sections: [
        {
          paragraphs: [
            "Hay una escena que se repite todos los días en decenas de automotoras del país.",
            "Un cliente escribe por WhatsApp preguntando por un vehículo.",
            "Al mismo tiempo, otro deja un comentario en Facebook.",
            "Un tercero consulta por MercadoLibre.",
            "El dueño de la automotora salta de una aplicación a otra, tratando de no perder ninguna consulta, mientras el reloj sigue corriendo."
          ]
        },
        {
          heading: "Un patrón que se repite en casi todas las automotoras de Uruguay",
          paragraphs: [
            "Lo que casi nadie ve es lo que pasa del otro lado.",
            "Ese mismo cliente, mientras espera respuesta, está mirando el mismo modelo de auto en otras dos o tres automotoras.",
            "Y en la mayoría de los casos, le termina comprando a la que contestó primero.",
            "No necesariamente a la que tenía el mejor precio, ni el mejor auto. A la que respondió antes.",
            "Los dueños de automotora no pierden esas ventas por falta de esfuerzo. Trabajan largas jornadas, conocen su rubro y saben cerrar una venta cara a cara.",
            "El problema es otro: las herramientas que hoy manejan sus consultas están desconectadas entre sí.",
            "Y esa desconexión tiene un costo que casi nunca se mide con precisión."
          ]
        },
        {
          heading: "El costo real de no tener un sistema",
          paragraphs: [
            "Haga un cálculo simple.",
            "Si una automotora recibe, por ejemplo, 30 consultas al mes entre WhatsApp, Instagram, Facebook y MercadoLibre, y una de cada cinco se pierde por demoras o falta de seguimiento, eso son 6 clientes por mes que terminan comprando en otro lado.",
            "Multiplicado por lo que deja cada venta, ese número suele ser mucho más alto de lo que cualquier dueño de automotora imagina.",
            "Es un costo que no aparece en ningún balance.",
            "Se siente, mes a mes, en forma de oportunidades que nunca se convirtieron en ventas."
          ]
        },
        {
          heading: "Por qué esto ya no es exclusivo de las automotoras grandes",
          paragraphs: [
            "Durante años, tener un sitio web propio, un sistema de gestión de clientes y una bandeja única para todas las consultas fue algo reservado a las automotoras más grandes.",
            "Automotoras con presupuesto para contratar programadores y armar un equipo de sistemas propio.",
            "Eso está cambiando.",
            "n-sistemas.com es una empresa uruguaya dedicada exclusivamente a resolver este problema para automotoras de cualquier tamaño, y su producto se llama n-autos.com.",
            "Su función: montar y administrar toda la tecnología de la automotora. El sitio web, el sistema de gestión de clientes, y la conexión con WhatsApp, Facebook, Instagram y MercadoLibre.",
            "Para que el dueño no tenga que ocuparse de nada técnico.",
            "Cuando un cliente escribe por cualquiera de esos canales, el mensaje llega organizado a un mismo lugar, con su historial y asignado a un vendedor.",
            "Si hay una publicación en Facebook o en MercadoLibre, se puede gestionar directamente desde el sistema, sin entrar a cada plataforma por separado.",
            "Eso también forma parte del servicio.",
            "Y el dueño puede ver, en cualquier momento, cuántas consultas tuvo, cuántos vehículos tiene disponibles y qué tan rápido está respondiendo su equipo.",
            "Todo esto sin que el dueño tenga que aprender de tecnología. n-autos.com se encarga del servidor, la seguridad, las actualizaciones y el soporte técnico continuo."
          ]
        },
        {
          heading: "«¿Y si yo no entiendo nada de sistemas?»",
          paragraphs: [
            "Es la primera objeción que surge, y es exactamente el punto.",
            "No hace falta entender.",
            "El equipo de n-autos.com se ocupa de la parte técnica.",
            "El dueño de la automotora se dedica a lo que mejor sabe hacer: atender clientes y cerrar ventas.",
            "No hay límite de vehículos ni de vendedores en el sistema, y el soporte técnico sigue disponible una vez que todo está funcionando."
          ]
        },
        {
          heading: "Lo que reportan las automotoras que ya lo resolvieron",
          paragraphs: [
            "Las automotoras que centralizaron su operación de esta manera coinciden en algo: responden más rápido, pierden menos clientes por falta de seguimiento, y su equipo comercial recupera horas que antes se iban en tareas repetitivas.",
            "No es una promesa de «modernización digital» abstracta.",
            "Es tiempo real que vuelve a estar disponible para vender. Son consultas que antes se perdían por no tener quién les hiciera seguimiento a tiempo."
          ]
        },
        {
          heading: "¿Cuánto le está costando a usted no tener esto resuelto?",
          paragraphs: [
            "Antes de seguir, hágase estas preguntas con honestidad.",
            "¿Sabe con exactitud cuántas consultas recibió su automotora esta semana entre WhatsApp, Instagram, Facebook y MercadoLibre?",
            "¿Le pasó alguna vez que un cliente escribió, usted se demoró en contestar, y cuando volvió a escribirle ya le había comprado a otro?",
            "¿Termina sus días más cansado de administrar plataformas que de vender autos?",
            "Si respondió que sí a alguna de estas preguntas, su automotora está perdiendo dinero todos los meses.",
            "De una forma que probablemente nunca se detuvo a calcular.",
            "La buena noticia es que resolver esto no depende de que usted aprenda de tecnología.",
            "Tampoco de que contrate un programador, ni de que su equipo dedique semanas a configurar sistemas complejos.",
            "El equipo de n-autos.com, el producto de n-sistemas.com para automotoras, analiza cómo trabaja hoy su negocio.",
            "Identifica dónde se están perdiendo consultas.",
            "Y le arma su sitio web y su sistema de gestión a medida.",
            "Todo esto en cuestión de días, no de meses.",
            "Y puede dar el primer paso con el equipo de n-autos.com, contarles cómo trabaja su automotora actualmente, y dejar que le muestren, sin compromiso, cómo se vería su negocio con todo centralizado y funcionando.",
            "Cada semana que pasa sin resolver esto es, en promedio, otro puñado de clientes que terminan comprándole a la automotora que contestó primero.",
            "Hable hoy con el equipo de n-autos.com y deje de perder clientes por falta de seguimiento.",
            "Ingrese a n-autos.com y complete el formulario de contacto.",
            "Un asesor se comunicará con usted para conocer su automotora y mostrarle, paso a paso, cómo sería tener toda su tecnología resuelta.",
            "Para que usted vuelva a dedicarse a lo único que realmente hace crecer su negocio:",
            "Vender."
          ]
        }
      ]
    }
  },
  {
    slug: "por-que-las-automotoras-pierden-el-40-de-los-leads-de-whatsapp",
    title: "Por Qué las Automotoras Pierden Hasta el 40% de los Leads de WhatsApp y Redes Sociales",
    subtitle: "El tiempo medio de respuesta de una automotora en Uruguay supera las 3 horas. El cliente digital espera menos de 15 minutos.",
    category: "Estrategia & CRM",
    author: "Mauricio Negrin",
    date: "12 de Agosto, 2026",
    readTime: "3 min de lectura",
    edition: "Optimización Comercial",
    image: "/hero_dashboard.jpg",
    content: {
      authorBio: "Mauricio Negrin es fundador de n-sistemas.com y creador de n-autos.com.",
      sections: [
        {
          paragraphs: [
            "En el mercado automotor moderno, el primer vendedor que responde un WhatsApp suele ser el que cierra la operación.",
            "Cuando un comprador busca un coche usado o cero kilómetro, envía mensajes simultáneos a 3 o 4 publicaciones distintas.",
            "Si su automotora tarda más de 20 minutos en contestar, las probabilidades de agendar una visita caen más de un 60%."
          ]
        },
        {
          heading: "Centralización de consultas",
          paragraphs: [
            "Con n-autos.com, cada lead ingresado por MercadoLibre, WhatsApp o formularios web entra a un panel unificado de la automotora.",
            "El equipo comercial recibe alertas inmediatas y el cliente obtiene atención rápida sin pérdidas de información."
          ]
        }
      ]
    }
  },
  {
    slug: "como-sincronizar-mercadolibre-y-redes-sin-duplicar-trabajo",
    title: "Cómo Sincronizar MercadoLibre y Redes Sociales sin Duplicar Tareas Comerciales",
    subtitle: "Publicar vehículo por vehículo en cada plataforma consume decenas de horas al mes. La clave está en la automatización centralizada.",
    category: "Tecnología & Automatización",
    author: "Mauricio Negrin",
    date: "08 de Agosto, 2026",
    readTime: "5 min de lectura",
    edition: "Sistemas & Gestión",
    image: "/hero_dealership_drone.jpg",
    content: {
      authorBio: "Mauricio Negrin es fundador de n-sistemas.com y creador de n-autos.com.",
      sections: [
        {
          paragraphs: [
            "Cargar fotos, ficha técnica, precio y detalles de cada vehículo individualmente en Facebook, Instagram y MercadoLibre es una tarea repetitiva que desgasta al equipo de ventas.",
            "Un sistema unificado permite ingresar el vehículo una sola vez y sincronizar automáticamente el stock en todas las plataformas."
          ]
        },
        {
          heading: "Carga única de inventario",
          paragraphs: [
            "Gracias a la plataforma n-autos.com, la automotora mantiene su stock actualizado en tiempo real, evitando publicar vehículos que ya fueron vendidos."
          ]
        }
      ]
    }
  }
];
