import type { ProductTranslations } from "./schema";

/**
 * French and English versions of the Sabili texts: translations of the Arabic content (seed-data.ts
 * and the live product page), nothing added. Applied by migration 0005 and by the seed; editable
 * afterwards from the dashboard.
 */
export const SABILI_TRANSLATIONS: ProductTranslations = {
  fr: {
    name: "Sabili",
    tagline: "Jeu de cartes de questions islamiques pour la famille et les amis",
    shortDescription:
      "125 cartes de questions sur la croyance, le Coran, le fiqh, la Sîra et l’histoire islamique, sur deux niveaux : colorées (faciles) et jaunes (plus difficiles).",
    description: [
      "Sabili est un jeu de cartes qui réunit la famille et les amis autour de questions sur leur religion. Chaque joueur tire une carte et pose sa question à son voisin ; à chaque manche, la difficulté augmente et le défi grandit.",
      "Les questions couvrent cinq domaines : la croyance (‘aqîda), le Coran, le fiqh, la Sîra du Prophète et l’histoire islamique. Les cartes colorées portent les questions faciles, les jaunes les plus difficiles.",
      "À la fin, le gagnant ne repart pas seulement avec des points : il distribue aux perdants des cartes « Hassana » et « Maw‘idha », et le jeu devient lui-même une œuvre récompensée.",
    ].join("\n\n"),
    ageRange: "À partir de 9 ans",
    contents: [
      { label: "Cartes de questions", value: "125 cartes : colorées (questions faciles) et jaunes (questions plus difficiles)" },
      { label: "Domaines des questions", value: "Croyance, Coran, fiqh, Sîra, histoire islamique" },
      { label: "Cartes de victoire", value: "Cartes « Hassana » et cartes « Maw‘idha » (en plus des 125 cartes)" },
      { label: "Règles du jeu", value: "Une fiche imprimée qui explique les manches et le calcul des points" },
    ],
    howToPlay: [
      {
        title: "Première manche",
        body: "Chaque joueur tire 4 cartes colorées. Le joueur le plus âgé commence et pose une question au joueur à sa droite. Si la réponse est juste, celui-ci garde la carte ; sinon, la carte est mise de côté. On continue jusqu’à épuisement des cartes.",
      },
      { title: "Deuxième manche", body: "Chaque joueur tire 3 cartes colorées et 1 carte jaune. La carte jaune augmente la difficulté." },
      { title: "Troisième manche", body: "Chaque joueur tire 2 cartes colorées et 2 cartes jaunes." },
      {
        title: "Manche finale",
        body: "Chaque joueur compte ses points : chaque carte colorée juste = 10 points (10 secondes pour répondre), chaque carte jaune juste = 30 points (35 secondes pour répondre). Les deux joueurs qui ont le plus de points se qualifient pour le défi final et s’échangent les questions dans l’ordre : croyance, Coran, fiqh, Sîra, histoire, les colorées puis les jaunes. S’ils se trompent tous les deux ou répondent tous les deux juste, ils passent à une nouvelle manche ; si un seul répond juste, il gagne et la partie s’arrête.",
      },
      { title: "Après la victoire", body: "Le gagnant donne une carte « Hassana » ou une carte « Maw‘idha » aux joueurs perdants." },
      {
        title: "Titres selon les points",
        body: "Moins de 60 : Débutant · plus de 60 : Audacieux · plus de 100 : Intrépide · plus de 130 : Vaillant · 220 et plus : Champion des champions.",
      },
    ],
    benefits: [
      "On apprend dans cinq domaines : la croyance, le Coran, le fiqh, la Sîra et l’histoire islamique.",
      "Chaque question ouvre une discussion : celui qui connaît l’histoire la raconte aux autres.",
      "Réunit petits et grands (dès 9 ans) autour d’une même table, loin des écrans.",
      "Deux niveaux de difficulté font grandir le défi d’une manche à l’autre.",
      "Les cartes Hassana et Maw‘idha transforment la fin de la partie en bonne action.",
    ],
    faq: [
      { q: "À partir de quel âge ?", a: "Dès 9 ans ; petits et grands y jouent ensemble." },
      { q: "Combien de cartes contient la boîte ?", a: "125 cartes de questions (colorées et jaunes), plus les cartes Hassana et Maw‘idha et la fiche de règles." },
      {
        q: "Quelle différence entre les cartes colorées et les jaunes ?",
        a: "Les colorées sont des questions faciles (10 points, 10 secondes pour répondre), les jaunes des questions plus difficiles (30 points, 35 secondes pour répondre).",
      },
      { q: "Comment le gagnant est-il désigné ?", a: "Après les trois manches, les deux meilleurs scores s’affrontent dans un défi final ; celui qui est seul à répondre juste gagne." },
    ],
  },
  en: {
    name: "Sabili",
    tagline: "An Islamic question card game for family and friends",
    shortDescription:
      "125 question cards on belief, the Quran, fiqh, the Seerah and Islamic history, on two levels: coloured (easy) and yellow (harder).",
    description: [
      "Sabili is a card game that brings family and friends together around questions about their faith. Each player draws a card and asks its question to the person next to them; every round the difficulty rises and the challenge grows.",
      "The questions cover five fields: belief (‘aqeedah), the Quran, fiqh, the Prophet’s Seerah and Islamic history. Coloured cards carry the easy questions, yellow cards the harder ones.",
      "In the end the winner doesn’t just walk away with points: they hand the others “Hassana” and “Maw‘idha” cards, so the game itself becomes a deed you are rewarded for.",
    ].join("\n\n"),
    ageRange: "Ages 9 and up",
    contents: [
      { label: "Question cards", value: "125 cards: coloured (easy questions) and yellow (harder questions)" },
      { label: "Question fields", value: "Belief, Quran, fiqh, Seerah, Islamic history" },
      { label: "Winner’s cards", value: "“Hassana” cards and “Maw‘idha” cards (on top of the 125 cards)" },
      { label: "Game rules", value: "A printed sheet explaining the rounds and how points are counted" },
    ],
    howToPlay: [
      {
        title: "Round one",
        body: "Each player draws 4 coloured cards. The oldest player starts and asks a question to the player on their right. If the answer is right, that player keeps the card; if it’s wrong, the card is set aside. Play goes on until all the cards are used.",
      },
      { title: "Round two", body: "Each player draws 3 coloured cards and 1 yellow card. The yellow card raises the difficulty." },
      { title: "Round three", body: "Each player draws 2 coloured cards and 2 yellow cards." },
      {
        title: "Final round",
        body: "Each player counts their points: each correct coloured card = 10 points (10 seconds to answer), each correct yellow card = 30 points (35 seconds to answer). The two players with the most points go through to the final challenge and take turns asking questions in order: belief, Quran, fiqh, Seerah, history, coloured then yellow. If both answer wrong or both answer right, they move on to a new round; if only one answers right, they win and the game ends.",
      },
      { title: "After the win", body: "The winner gives a “Hassana” card or a “Maw‘idha” card to the losing players." },
      {
        title: "Titles by points",
        body: "Under 60: Beginner · over 60: Bold · over 100: Fearless · over 130: Valiant · 220 and above: Champion of champions.",
      },
    ],
    benefits: [
      "You learn in five fields: belief, the Quran, fiqh, the Seerah and Islamic history.",
      "Every question opens a conversation: whoever knows the story tells it to the others.",
      "Brings young and old (from age 9) around one table, away from screens.",
      "Two difficulty levels make the challenge grow from one round to the next.",
      "Hassana and Maw‘idha cards turn the end of the game into a good deed.",
    ],
    faq: [
      { q: "What age is the game for?", a: "Ages 9 and up; young and old play it together." },
      { q: "How many cards are in the box?", a: "125 question cards (coloured and yellow), plus the Hassana and Maw‘idha cards and the rules sheet." },
      {
        q: "What’s the difference between coloured and yellow cards?",
        a: "Coloured cards are easy questions (10 points, 10 seconds to answer); yellow cards are harder questions (30 points, 35 seconds to answer).",
      },
      { q: "How is the winner decided?", a: "After the three rounds, the two highest scores face off in a final challenge, and whoever alone answers correctly wins." },
    ],
  },
};
