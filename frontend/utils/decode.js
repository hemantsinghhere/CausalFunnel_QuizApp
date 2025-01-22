// Utility function to decode HTML entities in the API data
const decodeHTML = (str) => {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = str;
    return textarea.value;
  };
  
  // Shuffle answers array
const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);
  
