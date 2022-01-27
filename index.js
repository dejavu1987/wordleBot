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

// Initialize correct patter with no letters dashes means any letter will be replaced as we find correct letters
let correct = '-----';

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

//
// Check the game state and filter out words
const getGameState = (remainingWords) => {
  const gameState = JSON.parse(localStorage.getItem('gameState'));
  const boardState = gameState.boardState;
  const evaluations = gameState.evaluations;

  const absent = [];
  const present = [];

  boardState.forEach((attempt, i) => {
    attempt.split('').forEach((l, j) => {
      switch (evaluations[i][j]) {
        case 'absent':
          absent.push(l);
          break;

        case 'present':
          // if this letter is repeated and flagged as absent for being on different position !!some weirdness
          const absIdx = absent.indexOf(l);
          if (absIdx > -1) {
            absent.splice(absIdx, 1);
          }
          present.push(l);
          break;

        case 'correct':
          var correctArray = correct.split('');
          correctArray[j] = l;
          correct = correctArray.join('');
          break;

        default:
          break;
      }
    });
  });

  return remainingWords
    .filter((w) => containsAll(w, present))
    .filter((w) => doesNotContain(w, absent))
    .filter((w) => w.match(new RegExp(correct.replace(/-/g, '\\w'))));
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
  console.log(words);
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
  remainingWords = getGameState(remainingWords);
  console.log(remainingWords);

  // repeat
  let count = 0;
  let t = setInterval(() => {
    count++;
    // Either win or ran out of turns
    if (count > 4 || correct.indexOf('-') === -1) {
      clearInterval(t);
      localStorage.removeItem('gameState');
      setTimeout(() => {
        location.reload();
      }, 3000);
    }
    hitWord(remainingWords[0]);
    remainingWords = getGameState(remainingWords);
    console.log(remainingWords);
  }, 2000);
})();
