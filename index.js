const CANVAS = document.getElementById("canvas");
const CTX = CANVAS.getContext("2d");
const ROW_COUNT = 20;
const COLUMN_COUNT = 20;

CANVAS.width = 1000;
CANVAS.height = 1000;

var blockConfig;

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function eq(o1, o2) {
  return o1[0] == o2[0] && o1[1] == o2[1];
}

function setBlockConfig() {
  const w = CANVAS.width / COLUMN_COUNT;
  const h = CANVAS.height / ROW_COUNT;

  blockConfig = {
    width: w,
    height: h,
    hor_padding: 3,
    vert_padding: 3,
  };
}

function drawBoard() {
  for (let i = 0; i < COLUMN_COUNT; i++) {
    for (let j = 0; j < ROW_COUNT; j++) {
      drawSquare(i, j);
    }
  }
}

function drawSquare(i, j, color) {
  const x = blockConfig.width * i + blockConfig.hor_padding;
  const y = blockConfig.height * j + blockConfig.vert_padding;
  const w = blockConfig.width - 2 * blockConfig.hor_padding;
  const h = blockConfig.height - 2 * blockConfig.vert_padding;

  if (color) {
    CTX.fillStyle = color;
  } else if (i == 0 || j == 0 || i == COLUMN_COUNT - 1 || j == ROW_COUNT - 1) {
    CTX.fillStyle = "#000000";
  } else {
    CTX.fillStyle = "#666666";
  }

  CTX.fillRect(x, y, w, h);
}

class Snake {
  constructor() {
    this.head = [5, 5];
    this.body = [
      [5, 6],
      [5, 7],
      [5, 8],
    ];
    this.playing = true;
    this.direction = actions.UP;
    this.actions = [];
    this.lastAction = 0;
    this.speed = 500;

    this.candy = this.genCandy();
  }

  genCandy() {
    let candy = [
      getRndInteger(1, COLUMN_COUNT - 1),
      getRndInteger(1, ROW_COUNT - 1),
    ];

    while (eq(candy, this.head) || this.body.some((b) => eq(b, candy))) {
      candy = [
        getRndInteger(1, COLUMN_COUNT - 1),
        getRndInteger(1, ROW_COUNT - 1),
      ];
    }

    return candy;
  }

  headInWall() {
    const [x, y] = this.head;
    return x == 0 || y == 0 || x == COLUMN_COUNT - 1 || y == ROW_COUNT - 1;
  }

  update(time) {
    let shouldMove = false;

    while (this.actions.length > 0) {
      const action = this.actions.shift();
      if (action == actions.PAUSE) {
        this.playing = !this.playing;
        this.lastAction = time;
      } else {
        shouldMove = true;
        this.direction = action;
      }
    }

    if (this.playing && (shouldMove || time > this.lastAction + this.speed)) {
      this.lastAction = time;

      // Do the move thing
      this.body.unshift(this.head); // Add current location head
      this.head = [
        this.head[0] + this.direction[0],
        this.head[1] + this.direction[1],
      ]; // Move head

      if (this.head[0] == this.candy[0] && this.head[1] == this.candy[1]) {
        this.candy = this.genCandy();
        this.speed *= 0.93;
      } else {
        this.body.pop();
      }

      // Check lost
      if (this.headInWall() || this.body.some((b) => eq(b, this.head))) {
        window.location =
          "https://i.ytimg.com/vi/8cjzvJToHwo/maxresdefault.jpg";
      }
    }

    this.render();
    requestAnimationFrame(this.update.bind(this));
  }

  render() {
    drawBoard();

    drawSquare(...this.candy, "#00ff00");
    drawSquare(this.head[0], this.head[1], "#ff0000");
    for (let seg of this.body) {
      drawSquare(...seg, "#aa0000");
    }
  }
}

const actions = {
  PAUSE: "pause",
  UP: [0, -1],
  DOWN: [0, 1],
  LEFT: [1, 0],
  RIGHT: [-1, 0],
};

setBlockConfig();
const snake = new Snake();
snake.update();

CANVAS.addEventListener("resize", () => setBlockConfig());

document.onkeyup = function (e) {
  switch (e.key) {
    case "w":
      snake.actions.push(actions.UP);
      break;
    case "s":
      snake.actions.push(actions.DOWN);
      break;
    case "a":
      snake.actions.push(actions.RIGHT);
      break;
    case "d":
      snake.actions.push(actions.LEFT);
      break;
  }

  // Space
  if (e.keyCode == 32) {
    snake.actions.push(actions.PAUSE);
  }
};
