'use strict';

{
  class Reversi {
    constructor() {
      this.disks = [
        [0, 0, 0,  0,  0, 0, 0, 0],
        [0, 0, 0,  0,  0, 0, 0, 0],
        [0, 0, 0,  0,  0, 0, 0, 0],
        [0, 0, 0,  1, -1, 0, 0, 0],
        [0, 0, 0, -1,  1, 0, 0, 0],
        [0, 0, 0,  0,  0, 0, 0, 0],
        [0, 0, 0,  0,  0, 0, 0, 0],
        [0, 0, 0,  0,  0, 0, 0, 0],
      ];
      this.numCol = 8;
      this.numRow = this.numCol;
      this.squareSize = 45;
      this.boardSize = this.squareSize * this.numCol;
      this.turn = -1; // 先手は黒
      this.success = false; // 有効な手を打ったか
      this.lastMove = {};
      
      this.init();
      this.render();
      this.addListener();
    }

    init() {
      this.canvas = document.querySelector('canvas');
      if (typeof this.canvas.getContext === 'undefined') {
        return;
      }
      this.ctx = this.canvas.getContext('2d');

      // Retina対応
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width *= dpr;
      this.canvas.height *= dpr;
      this.ctx.scale(dpr, dpr);
      this.canvas.style.width = '360px';
      this.canvas.style.height = '360px';
    }

    render() {
      // 枠の描画
      this.ctx.fillStyle = '#086e36';
      this.ctx.fillRect(0, 0, this.boardSize, this.boardSize);
      this.ctx.strokeStyle = '#000';

      for (let col = 0; col <= this.numCol; col++) {
        this.ctx.beginPath();
        this.ctx.moveTo(this.squareSize * col, 0);
        this.ctx.lineTo(this.squareSize * col, this.boardSize);
        this.ctx.closePath();
        this.ctx.stroke();
      }
      for (let row = 0; row <= this.numRow; row++) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.squareSize * row);
        this.ctx.lineTo(this.boardSize, this.squareSize * row);
        this.ctx.closePath();
        this.ctx.stroke();
      }

      // 一つ前の手を表示
      this.showLastMove(this.lastMove.col, this.lastMove.row);        

      // ディスクの描画
      for (let row = 0; row < this.numRow; row++) {
        for (let col = 0; col < this.numCol; col++) {
          const num = this.disks[row][col];
    
          if (num === 1) {
            this.drawDisk(col, row, '#fff');
          } else if (num === -1) {
            this.drawDisk(col, row, '#000');
          }
        }
      }

      // スコアの表示
      this.showScore();

      // 打てる場所の探索
      if (this.search()) {
        let msg;
        
        this.turn *= -1;
        if (this.search()) {
          // 双方に打てる場所がなければ、ゲームの終了を通知
          if (this.lightScore > this.darkScore) {
            msg = 'ゲームが終わりました。白の勝ちです。';
          } else if (this.lightScore < this.darkScore) {
            msg = 'ゲームが終わりました。黒の勝ちです。';
          } else {
            msg = 'ゲームが終わりました。引き分けです。';
          }

          document.getElementById('show_score').checked = true;
          this.showScore();
        } else {
          // 一方だけ打てる場所がなければ、もう一方の手番が続くことを通知
          if (this.turn === 1) {
            msg = '黒は打てる場所がないので、もう一度、白の手番になります。';
          } else {
            msg = '白は打てる場所がないので、もう一度、黒の手番になります。';
          }
        }

        setTimeout(() => {
          alert(msg);
        }, 1);
      }
    }

    drawDisk(col, row, color) {
      this.ctx.beginPath();
      this.ctx.arc(this.squareSize * (col + 0.5), this.squareSize * (row + 0.5),
        15, 0, 360 / 180 * Math.PI);
      this.ctx.closePath();
      this.ctx.strokeStyle = color;
      this.ctx.stroke();
      this.ctx.fillStyle = color;
      this.ctx.fill();
    }

    showScore() {
      const light = document.getElementById('light');
      const dark = document.getElementById('dark');

      if (document.getElementById('show_score').checked) {
        this.lightScore = 0;
        this.darkScore = 0;

        for (let row = 0; row < this.numRow; row++) {
          for (let col = 0; col < this.numCol; col++) {
            if (this.disks[row][col] === 1) {
              this.lightScore++;
            } else if (this.disks[row][col] === -1) {
              this.darkScore++;
            }
          }
        }

        light.textContent = this.lightScore;
        dark.textContent = this.darkScore;
      } else {
        light.textContent = '?';
        dark.textContent = '?';
      }
    }

    search() {
      let skip = true;
      const searchNext = document.getElementById('search_next').checked;
      
      for (let row = 0; row < this.numRow; row++) {
        for (let col = 0; col < this.numCol; col++) {
          this.success = false;

          if (this.placeDisk(col, row, true)) {
            if (this.turn === 1) {
              skip = false;
              if (searchNext) {
                this.drawDisk(col, row, 'rgba(255, 255, 255, 0.2)');
              }
            } else if (this.turn === -1) {
              skip = false;
              if (searchNext) {
                this.drawDisk(col, row, 'rgba(0, 0, 0, 0.2)');
              }
            }
          }
        }
      }

      return skip;
    }

    showLastMove(col, row) {
      this.ctx.fillStyle = 'rgba(127, 255, 0, 0.2)';
      this.ctx.fillRect(this.squareSize * col, this.squareSize * row,
        this.squareSize, this.squareSize);
    }

    addListener() {
      this.canvas.addEventListener('click', e => {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const col = Math.floor(x / this.squareSize);
        const row = Math.floor(y / this.squareSize);
        
        if (this.placeDisk(col, row)) {
          this.turn *= -1;
          [this.lastMove.col, this.lastMove.row] = [col, row];
          this.render();
        }
        this.success = false;
      });

      document.getElementById('show_score').addEventListener('change', () => {
        this.showScore();
      });
      document.getElementById('search_next').addEventListener('change', () => {
        this.render();
      });
    }

    placeDisk(col, row, test = false) {
      if (this.disks[row][col] !== 0) {
        return;
      }

      const dirs = [
        {x:  0, y: -1},
        {x:  1, y: -1},
        {x:  1, y:  0},
        {x:  1, y:  1},
        {x:  0, y:  1},
        {x: -1, y:  1},
        {x: -1, y:  0},
        {x: -1, y: -1},
      ];

      // 8方向をチェックするので、その数ぶんループを回す
      for (let i = 0; i < dirs.length; i++) {
        let targetRow = row + dirs[i].y;
        let targetCol = col + dirs[i].x;
        
        // 隣の石が相手の色でない場合は、その回のループを終了
        if (targetRow < 0 || targetRow >= 8) {
          continue;
        }
        if (targetCol < 0 || targetCol >= 8) {
          continue;
        }
        if (this.disks[targetRow][targetCol] !== -this.turn) {
          continue;
        }

        // console.log("A", this.turn, i, targetRow, targetCol, this.disks)

        // 相手の色が出る限りターゲットを同じ方向に進め、その途中で盤の外に出た場合は終了
        while (this.disks[targetRow][targetCol] === -this.turn) {
          targetRow += dirs[i].y;
          targetCol += dirs[i].x;

          // これを書かないとwhileの条件式を実行したときにエラーが出る
          if (targetRow < 0 || targetRow >= 8) {
            break;
          }
          if (targetCol < 0 || targetCol >= 8) {
            break;
          }
        }
        
        // 相手の石の先でターゲットが盤の外か、まだ空白のマスだったら終了
        if (targetRow < 0 || targetRow >= 8) {
          continue;
        }
        if (targetCol < 0 || targetCol >= 8) {
          continue;
        }
        if (this.disks[targetRow][targetCol] === 0) {
          continue;
        }

        // console.log("B", this.turn, i, targetRow, targetCol, this.disks)

        // ターゲットが自分の石だったら、間にあった石をひっくり返しながら元の位置まで戻る
        if (this.disks[targetRow][targetCol] === this.turn) {
          if (!test) {
            targetRow -= dirs[i].y;
            targetCol -= dirs[i].x;

            while (this.disks[targetRow][targetCol] === -this.turn) {
              this.disks[targetRow][targetCol] = this.turn;
              targetRow -= dirs[i].y;
              targetCol -= dirs[i].x;
            }
            this.disks[row][col] = this.turn;
          }

          // ここでreturn trueを使わないのは、for文を最後まで回す必要があるから
          this.success = true;
        }
      }

      return this.success;
    }
  }

  new Reversi();
}