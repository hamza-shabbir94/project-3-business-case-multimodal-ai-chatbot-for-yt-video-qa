// FAQ shown on the landing page. vite.config.js also turns it into FAQ schema (JSON-LD)
// in index.html, so search engines and answer engines read the same text.
export const FAQ = [
  {
    q: 'Is it free?',
    a: 'Yes. There is no account, no signup and nothing to install. Open the chat and ask.',
  },
  {
    q: 'Where do the answers come from?',
    a: 'Only from the transcripts of 18 fitness videos on YouTube. If a fact is not in those videos, the bot does not use it.',
  },
  {
    q: 'How do I check an answer?',
    a: 'Every fact has a timestamp button. Click it and YouTube opens at that second, so you can hear the creator say it.',
  },
  {
    q: 'What happens if the videos do not cover my question?',
    a: 'The bot tells you the videos do not cover it. It does not fill the gap with a guess.',
  },
  {
    q: 'Can the answers be wrong?',
    a: 'Sometimes. Automatic captions can mishear numbers, and the bot can quote them. That is why every answer links to its source. In testing it ranked the right video first for 11 of 12 questions.',
  },
  {
    q: 'Does it remember the conversation?',
    a: 'Yes. Each chat is saved under a random ID kept in your browser, so follow up questions work and a reload brings the chat back. New chat starts a fresh one.',
  },
  {
    q: 'How does the voice question work?',
    a: 'Press the microphone and speak for up to 60 seconds. The audio is turned into text, and you can edit the text before you send it. The audio itself is not stored.',
  },
  {
    q: 'Is this medical or personal advice?',
    a: 'No. It repeats what the videos say about training, nutrition and recovery. For health conditions, injuries or diets, ask a doctor or a registered dietitian.',
  },
  {
    q: 'Which videos does it know?',
    a: '18 videos from 8 channels, about 3 hours in total, on muscle growth, training volume, exercise technique, nutrition, fat loss and sleep. The full list is on this page.',
  },
]
