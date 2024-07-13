class Player {

  constructor({ x, y, score, id }) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id;
  }

  movePlayer(dir, speed) {
    switch (dir) {
      case "up":
        this.y = this.y - speed >= 50 ? this.y - speed : 50;
        break;
      case "down":
        this.y = this.y + speed <= 435 ? this.y + speed : 435;
        break;
      case "left":
        this.x = this.x - speed >= 5 ? this.x - speed : 5;
        break;
      case "right":
        this.x = this.x + speed <= 595 ? this.x + speed : 595;
        break;
    }
  }

  collision(item) {

  }

  calculateRank(arr) {

    let players = [...arr];

    players.sort((a, b) => b.score - a.score);

    let index = players.findIndex((e) => e.id == this.id);

    let count = players.reduce((acc, previous) => previous.score == this.score ? 1 + acc : 0 + acc, 0);

    let StartIndex = players.findIndex((e) => e.score == this.score);

    console.log(count,index);

    return  (count != 1 ? StartIndex + count : index +  1);

  }

}

export default Player;
