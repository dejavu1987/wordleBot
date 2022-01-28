// ==UserScript==
// @name         WordleBot
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       anilmaharjan.com.np
// @match        https://www.powerlanguage.co.uk/wordle/
// @icon         https://www.google.com/s2/favicons?domain=powerlanguage.co.uk
// @grant        none
// ==/UserScript==

// Initialize correct pattern with \w means any letter will be replaced as we find correct letters
let correct = ['\\w', '\\w', '\\w', '\\w', '\\w'];

// simulate keystroke
const hitKey = (key) => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }));
};

// simulate entering a word
const hitWord = (word) => {
  word.split('').forEach((key) => {
    hitKey(key);
  });
  hitKey('Enter');
};

// word does not contain any of the given letters
const doesNotContain = (word, letters) => {
  return !letters.some((l) => {
    return word.indexOf(l) > -1;
  });
};

// word contains all of the given letters
const containsAll = (word, letters) => {
  return letters.every((l) => {
    return word.indexOf(l) > -1;
  });
};

// Check the game state and filter out words
const getGameState = (remainingWords) => {
  const gameState = JSON.parse(localStorage.getItem('gameState'));
  if (!gameState) return remainingWords;

  const boardState = gameState.boardState;
  const evaluations = gameState.evaluations;

  const absent = [];
  const present = [];

  boardState.forEach((attempt, i) => {
    attempt.split('').forEach((l, j) => {
      switch (evaluations[i][j]) {
        case 'absent':
          var corrIdx = correct.indexOf(l);
          var presIdx = present.indexOf(l);
          if (presIdx === -1 && corrIdx === -1) {
            absent.push(l);
          }
          break;

        case 'present':
          // if this letter is repeated and flagged as absent for being on different position !!some weirdness
          var absIdx = absent.indexOf(l);
          if (absIdx > -1) {
            absent.splice(absIdx, 1);
          }
          present.push(l);
          //console.log(correct[j])
          if (correct[j] !== 'w') {
            correct[j] = `[^${l}]`;
          }
          break;

        case 'correct':
          // if this letter is repeated and flagged as absent for being on different position !!some weirdness
          var absIdx = absent.indexOf(l);
          if (absIdx > -1) {
            absent.splice(absIdx, 1);
          }
          correct[j] = l;
          break;

        default:
          break;
      }
    });
  });
  //console.log({absent, present, correct})
  const corrExp = correct.join('');
  //console.log(corrExp)
  return remainingWords
    .filter((w) => containsAll(w, present))
    .filter((w) => doesNotContain(w, absent))
    .filter((w) => w.match(new RegExp(corrExp)));
};

(async function () {
  'use strict';
  const game = document
    .getElementsByTagName('game-app')[0]
    .shadowRoot.getElementById('game');

  // Get 5 letter words from charlesreid1's github repo
  const wordDb = await fetch(
    'https://cdn.jsdelivr.net/gh/charlesreid1/five-letter-words@master/sgb-words.txt'
  ).then((res) => res.text());
  const words = wordDb.split('\n');
  //console.log(words);
  let remainingWords = words;

  const mostVowels = words.filter(
    (word) =>
      word.match('a') && word.match('i') && word.match('o') && word.match('u')
  );

  // Close the help model that appears in the beginning
  game
    .querySelector('game-modal')
    .shadowRoot.querySelector('.close-icon')
    .click();

  // Use the first word with most vowels
  //hitWord(mostVowels[0])

  // Use Random first word just for fun
  hitWord(words[Math.floor(Math.random() * 5000)]);

  //hitWord('potty');
  //hitWord('nouns');
  //hitWord('tasty');
  //hitWord('moons');
  remainingWords = getGameState(remainingWords);
  console.log('Remaining words: ' + remainingWords.length);

  // repeat
  let count = 0;
  let t = setInterval(() => {
    count++;
    console.log(count);
    // Either win or ran out of turns
    //console.log(count)
    //console.log(correct.indexOf('\\w'))

    hitWord(remainingWords[0]);
    remainingWords = getGameState(remainingWords);
    console.log('Remaining words: ' + remainingWords.length);
    console.log(remainingWords);

    if (count > 4 || localStorage.getItem('gameStatus') === 'WIN') {
      clearInterval(t);
      localStorage.removeItem('gameState');
      setTimeout(() => {
        location.reload();
      }, 3000);
    }
  }, 2000);
})();
