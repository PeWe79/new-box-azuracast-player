"use strict";

/** All Public Station in Azuracast information */
const musicData = [];

/** Fetch API data from Azuracast server */
function fetchData() {
  fetch(apiUrl + "/api/nowplaying")
    .then((e) => (e.ok || checkError("Failed to load API data", () => location.reload()), e.json()))
    .then((data) => {
      data.forEach((reslt) => {
        const randomNumber = Math.floor(Math.random() * 5);
        const fileName = ".jpg";
        const extension = fileName.split("/").pop();

        musicData.push({
          posterUrl: reslt.now_playing.song.art,
          imgBrand: apiUrl + "/static/uploads/" + reslt.station.shortcode + "/" + "album_art." + randomNumber + extension,
          bgimg: reslt.now_playing.song.art,
          title: reslt.now_playing.song.title,
          album: reslt.now_playing.song.album,
          name: reslt.station.name,
          artist: reslt.now_playing.song.artist,
          streamUrl: reslt.station.listen_url,
          api: apiUrl + "/api/nowplaying_static/" + reslt.station.shortcode + ".json",
          played_at: reslt.now_playing.played_at,
          history: reslt.song_history,
        });
      }),
        processData();
    })
    .catch((err) => {
      console.error("Error fetching JSON:", err);
    });
}

function checkError(data) {
  console.error("Error loading data:", data);
}

fetchData();

/**
 * Process data
 * from feth data
 */
function processData() {

  // add eventListnere on all elements that are passed
  const addEventOnElements = function (elements, eventType, callback) {
    for (let i = 0, len = elements.length; i < len; i++) {
      elements[i].addEventListener(eventType, callback);
    }
  }

  // add all station azuracast public in playlist, from 'musicData'
  const playlist = document.querySelector("[data-music-list]");

  for (let i = 0, len = musicData.length; i < len; i++) {
    playlist.innerHTML += `
  <li>
    <p class="label-md" id="station">${musicData[i].name}</p>
    <button class="music-item ${i === 0 ? "playing" : ""}" data-playlist-toggler data-playlist-item="${i}">
      <img src="${musicData[i].imgBrand}" width="800" height="800" alt="${musicData[i].title} Album Poster"
        class="img-cover">

      <div class="item-icon">
        <span class="material-symbols-rounded">equalizer</span>
      </div>
    </button>
  </li>
  `;
  }

  /**
   * PLAYLIST MODAL SIDEBAR TOGGLE
   * 
   * show 'playlist' modal sidebar when click on playlist button in top app bar
   * and hide when click on overlay or any playlist-item
   */

  const playlistSideModal = document.querySelector("[data-playlist]");
  const playlistTogglers = document.querySelectorAll("[data-playlist-toggler]");
  const overlay = document.querySelector("[data-overlay]");

  const togglePlaylist = function () {
    playlistSideModal.classList.toggle("active");
    overlay.classList.toggle("active");
    document.body.classList.toggle("modalActive");
  }

  addEventOnElements(playlistTogglers, "click", togglePlaylist);

  /**
   * PLAYLIST ITEM
   * remove active state from last time played music
   * and add active state in clicked music
   */

  const playlistItems = document.querySelectorAll("[data-playlist-item]");

  let currentMusic = 0;
  let lastPlayedMusic = 0;

  const changePlaylistItem = function () {
    playlistItems[lastPlayedMusic].classList.remove("playing");
    playlistItems[currentMusic].classList.add("playing");
  }

  addEventOnElements(playlistItems, "click", function () {
    lastPlayedMusic = currentMusic;
    currentMusic = Number(this.dataset.playlistItem);
    changePlaylistItem();
  });

  /**
   * PLAYER
   * change all visual information on player, based on current music
   */

  const playerBanner = document.querySelector("[data-player-banner]");
  const playerTitle = document.querySelector("[data-title]");
  const playerAlbum = document.querySelector("[data-album]");
  const playerArtist = document.querySelector("[data-artist]");

  const audioSource = new Audio(musicData[currentMusic].streamUrl);

  const changePlayerInfo = function () {
    playerBanner.setAttribute("alt", `${musicData[currentMusic].title} Album Poster`);
    playerTitle.textContent = musicData[currentMusic].title;
    playerAlbum.textContent = musicData[currentMusic].album;
    playerArtist.textContent = musicData[currentMusic].artist;

    audioSource.src = musicData[currentMusic].streamUrl;
    playMusic();
  }

  addEventOnElements(playlistItems, "click", changePlayerInfo);

  /**
   * PLAY MUSIC
   * 
   * play and pause music when click on play button
   */

  const playBtn = document.querySelector("[data-play-btn]");

  let playInterval;

  const playMusic = function () {
    audioSource.volume = 1;
    if (audioSource.paused) {
      audioSource.play();
      playBtn.classList.add("active");
    } else {
      audioSource.pause();
      playBtn.classList.remove("active");
      clearInterval(playInterval);
    }
  }

  playBtn.addEventListener("click", playMusic);

  /**
   * SKIP TO NEXT STATION
   */

  const playerSkipNextBtn = document.querySelector("[data-skip-next]");

  const skipNext = function () {
    lastPlayedMusic = currentMusic;
    currentMusic >= musicData.length - 1 ? currentMusic = 0 : currentMusic++;

    changePlayerInfo();
    changePlaylistItem();
  }

  playerSkipNextBtn.addEventListener("click", skipNext);

  /**
   * SKIP TO PREVIOUS STATION
   */

  const playerSkipPrevBtn = document.querySelector("[data-skip-prev]");

  const skipPrev = function () {
    lastPlayedMusic = currentMusic;
    currentMusic <= 0 ? currentMusic = musicData.length - 1 : currentMusic--;

    changePlayerInfo();
    changePlaylistItem();
  }

  playerSkipPrevBtn.addEventListener("click", skipPrev);

  /**
   * HISTORY STATION
   * 
   * History button
   */

  const histBtnEle = document.querySelector("[data-history]");
  const closeHistoryModal = document.querySelector("[close-history-modal]");

  histBtnEle.addEventListener("click", () => {
    getDataSelected(musicData[currentMusic].api),
      songListArt(musicData[currentMusic].history),
      document.getElementById("historyModal").classList.remove("hidden");
  });
  closeHistoryModal.addEventListener("click", () => {
    document.getElementById("historyModal").classList.add("hidden");
  });

  /**
   * SHOW HISTORY
   * 
   * History song list
   */

  const songHistListEle = document.querySelector("[song-history-list]");

  const songListArt = function (d) {
    songHistListEle.innerHTML = "";

    Array.isArray(d) && d.length > 0 ? d.forEach(async b => {
      if (!b.song.title || !b.song.artist) return;
      const n = await getHistCoverArt(b.song, !1);
      const frDate = b.played_at;
      const coverArt = n.art;
      const liEle = document.createElement("li");
      liEle.className = "py-2 flex items-center", liEle.innerHTML = `
                    ${coverArt ? `<img class="rounded-lg object-cover" src="${coverArt}" width="100" alt="${b.title} artwork">` : ""}
                    <div class="ml-3 flex-grow">
                        <p class="text-2xl font-bold text-white text-left">${b.song.title}</p>
                        <p class="text-medium text-gray-400 text-left">${b.song.artist}</p>
                        <p class="text-xs text-gray-900 mt-1 text-left">${setTime(getTime(frDate))}</p>
                    </div>
                `, songHistListEle.appendChild(liEle)
    }) : songHistListEle.innerHTML = '<li class="py-2 flex items-center justify-center"><img src="./assets/images/spinner.svg" alt="Loading..." class="animate-spin h-30 w-30"></li>'
  }

  const getTime = function (t) {
    return new Date(t * 1000);
  }

  const setTime = function (t) {
    const second = (o) => (Date.now() - o) / 1000;
    const format = {
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1,
    },
      n = (o) => {
        for (const [i, c] of Object.entries(format))
          if (o >= c || i === "second")
            return {
              value: Math.floor(Math.abs(o / c)),
              unit: i,
            };
      },
      a = (o) => {
        const i = new Intl.RelativeTimeFormat("en");
        const c = second(o);
        const { value: l, unit: _ } = n(c);
        const O = c > 0 ? -l : l;
        return i.format(O, _);
      },
      r = new Date(t);

    return a(r);
  }

  /**
   * 
   * @param {*} a = artist
   * @param {*} t = title
   * 
   * Get Now Playing Cover art
   */
  const getCoverArt = async function (t) {
    const cover = (l, _) => l.replace(/"100x100"/, _);
    const track = t.text;
    const urlCoverArt = t.art;
    const resp = await fetch(
      `https://itunes.apple.com/search?limit=1&term=${encodeURIComponent(track)}`
    );

    if (resp.status === 403)
      return {
        title: t.title,
        artist: t.artist,
        album: t.album,
        art: urlCoverArt,
      };

    const data = resp.ok ? await resp.json() : {};
    if (!data.results || data.results.length === 0)
      return {
        title: t.title,
        artist: t.artist,
        album: t.album,
        art: urlCoverArt,
      };

    const itunes = data.results[0];
    const results = {
      title: itunes.trackName || t.title,
      artist: itunes.artistName || t.artist,
      album: itunes.collectionName || t.album,
      art: itunes.artworkUrl100
        ? cover(itunes.artworkUrl100.replace("100x100", "512x512"))
        : urlCoverArt,
    };

    playerBanner.src = results.art || urlCoverArt;
    document.getElementById("artwork").src = results.art;
    document.body.style.backgroundImage = `url(${results.art})`;
    playerBanner.setAttribute("alt", `${results.title} Album Poster`);

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title,
        artist: t.artist,
        artwork: [
          {
            src: results.art,
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      });
    }

    return results;
  }

  /**
   * 
   * @param {*} t 
   * @returns 
   * 
   * Get Cover Art history
   */
  const getHistCoverArt = async function (t) {
    const cover = (l, _) => l.replace(/"100x100"/, _);
    const track = t.text;
    const urlCoverArt = t.art;
    const resp = await fetch(
      `https://itunes.apple.com/search?limit=1&term=${encodeURIComponent(track)}`
    );

    if (resp.status === 403)
      return {
        title: t.title,
        artist: t.artist,
        album: t.album,
        art: urlCoverArt,
      };

    const data = resp.ok ? await resp.json() : {};
    if (!data.results || data.results.length === 0)
      return {
        title: t.title,
        artist: t.artist,
        album: t.album,
        art: urlCoverArt,
      };

    const itunes = data.results[0];
    const results = {
      title: itunes.trackName || t.title,
      artist: itunes.artistName || t.artist,
      album: itunes.collectionName || t.album,
      art: itunes.artworkUrl100
        ? cover(itunes.artworkUrl100.replace("100x100", "512x512"))
        : urlCoverArt,
    };
    return results;
  }

  // Get data from selected station
  async function getDataSelected(data) {
    try {
      const reslt = await (await fetch(data)).json();
      const T = musicData[currentMusic];
      const artist = reslt.now_playing.song.artist || T.artist;
      const title = reslt.now_playing.song.title || T.title;
      const album = reslt.now_playing.song.album || T.album;

      // Open spotify
      const stream = "https://open.spotify.com/search/" + encodeURIComponent(artist + " - " + title);
      document.getElementById("spotify").href = stream;

      document.getElementById("title").innerHTML = title;
      document.title = artist + " - " + title;
      document.getElementById("album").innerHTML = album || "N/A";
      document.getElementById("artist").innerHTML = artist;
      const np = reslt.now_playing.song;
      getCoverArt(np);

    } catch (e) {
      console.error("Error fetching data:", e);
    }
  }

  function getData() {
    setInterval(() => {
      getDataSelected(musicData[currentMusic].api);
    }, 3000);
  }
  getData();
}
