'use strict'

class Reversi {
  constructor() {
    this.disks = []
    this.histDisks = [
      [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, -1, 0, 0, 0],
        [0, 0, 0, -1, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
      ]
    ]
    this.histMoves = [
      {}
    ]

    this.numCol = 8
    this.numRow = this.numCol
    this.squareSize = 45
    this.boardSize = this.squareSize * this.numCol
    this.undo = document.getElementById('undo')
    this.reset = document.getElementById('reset')

    this.initCanvas()
    this.initGame()
    this.addListener()
  }

  initCanvas() {
    this.canvas = document.querySelector('canvas')
    if (typeof this.canvas.getContext === 'undefined') {
      return
    }
    this.ctx = this.canvas.getContext('2d')

    // Retina対応
    const dpr = window.devicePixelRatio || 1
    this.canvas.width *= dpr
    this.canvas.height *= dpr
    this.ctx.scale(dpr, dpr)
    this.canvas.style.width = '360px'
    this.canvas.style.height = '360px'
  }

  initGame() {
    // histの最初の要素である配列の値をdisksにコピー
    this.histDisks[0].forEach((array, index) => {
      this.disks[index] = Array.from(array)
    })

    this.turn = -1 // 先手は黒
    this.render()
  }

  render() {
    // 枠の描画
    this.ctx.fillStyle = '#086e36'
    this.ctx.fillRect(0, 0, this.boardSize, this.boardSize)
    this.ctx.strokeStyle = '#000'

    for (let col = 0; col <= this.numCol; col++) {
      this.ctx.beginPath()
      this.ctx.moveTo(this.squareSize * col, 0)
      this.ctx.lineTo(this.squareSize * col, this.boardSize)
      this.ctx.closePath()
      this.ctx.stroke()
    }
    for (let row = 0; row <= this.numRow; row++) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, this.squareSize * row)
      this.ctx.lineTo(this.boardSize, this.squareSize * row)
      this.ctx.closePath()
      this.ctx.stroke()
    }

    // 一つ前の手を表示（ディスクより下のレイヤーで着色したいので、ここに書く）
    this.ctx.fillStyle = 'rgba(127, 255, 0, 0.2)'
    this.ctx.fillRect(
      this.squareSize * this.histMoves[this.histMoves.length - 1].col,
      this.squareSize * this.histMoves[this.histMoves.length - 1].row,
      this.squareSize, this.squareSize
    )

    // ディスクの描画
    for (let row = 0; row < this.numRow; row++) {
      for (let col = 0; col < this.numCol; col++) {
        const num = this.disks[row][col]

        if (num === 1) {
          this.drawDisk(col, row, '#fff')
        } else if (num === -1) {
          this.drawDisk(col, row, '#000')
        }
      }
    }

    // スコアの表示
    this.showScore()

    // 打てる場所の探索
    if (this.search()) {
      let msg

      this.turn *= -1
      if (this.search()) {
        // 双方に打てる場所がなければ、ゲームの終了を通知
        if (this.lightScore > this.darkScore) {
          msg = 'ゲームが終わりました。白の勝ちです。'
        } else if (this.lightScore < this.darkScore) {
          msg = 'ゲームが終わりました。黒の勝ちです。'
        } else {
          msg = 'ゲームが終わりました。引き分けです。'
        }

        document.getElementById('show_score').checked = true
        this.showScore()
      } else {
        // 一方だけ打てる場所がなければ、もう一方の手番が続くことを通知
        if (this.turn === 1) {
          msg = '黒は打てる場所がないので、もう一度、白の手番になります。'
        } else {
          msg = '白は打てる場所がないので、もう一度、黒の手番になります。'
        }
      }

      setTimeout(() => {
        alert(msg)
      }, 1)
    }

    // リセットボタンの操作
    if (this.darkScore + this.lightScore === 4) {
      this.undo.disabled = true
      this.reset.disabled = true
    } else {
      this.undo.disabled = false
      this.reset.disabled = false
    }
  }

  drawDisk(col, row, color) {
    this.ctx.beginPath()
    this.ctx.arc(this.squareSize * (col + 0.5), this.squareSize * (row + 0.5),
      15, 0, 360 / 180 * Math.PI)
    this.ctx.closePath()
    this.ctx.strokeStyle = color
    this.ctx.stroke()
    this.ctx.fillStyle = color
    this.ctx.fill()
  }

  showScore() {
    const dark = document.getElementById('dark')
    const light = document.getElementById('light')

    if (document.getElementById('show_score').checked) {
      this.darkScore = 0
      this.lightScore = 0

      for (let row = 0; row < this.numRow; row++) {
        for (let col = 0; col < this.numCol; col++) {
          if (this.disks[row][col] === -1) {
            this.darkScore++
          } else if (this.disks[row][col] === 1) {
            this.lightScore++
          }
        }
      }

      dark.textContent = this.darkScore
      light.textContent = this.lightScore
    } else {
      dark.textContent = '?'
      light.textContent = '?'
    }
  }

  search() {
    let skip = true
    const searchNext = document.getElementById('search_next').checked

    for (let row = 0; row < this.numRow; row++) {
      for (let col = 0; col < this.numCol; col++) {
        this.success = false // 有効な手かどうか

        if (this.placeDisk(col, row, true)) {
          if (this.turn === 1) {
            skip = false
            if (searchNext) {
              this.drawDisk(col, row, 'rgba(255, 255, 255, 0.2)')
            }
          } else if (this.turn === -1) {
            skip = false
            if (searchNext) {
              this.drawDisk(col, row, 'rgba(0, 0, 0, 0.2)')
            }
          }
        }
      }
    }

    return skip
  }

  addListener() {
    this.canvas.addEventListener('click', e => {
      const rect = e.target.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const col = Math.floor(x / this.squareSize)
      const row = Math.floor(y / this.squareSize)

      if (this.placeDisk(col, row)) {
        // 要素数8（各要素の中身はempty）の配列を用意して、そこにdisksの値をコピーしていく
        this.histDisks[this.histDisks.length] = Array(8)
        this.disks.forEach((array, index) => {
          this.histDisks[this.histDisks.length - 1][index] = Array.from(array)
        })
        this.histMoves.push({
          col: col, row: row
        })

        this.turn *= -1
        this.render()
      }
      this.success = false
    })

    this.undo.addEventListener('click', () => {
      this.histDisks.pop()
      this.histDisks[this.histDisks.length - 1].forEach((array, index) => {
        this.disks[index] = Array.from(array)
      })
      this.histMoves.pop()

      this.turn *= -1
      this.render()
    })

    this.reset.addEventListener('click', () => {
      if (confirm('このゲームを破棄して、リセットしますか？')) {
        while (this.histDisks.length > 1) {
          this.histDisks.pop()
        }
        while (this.histMoves.length > 1) {
          this.histMoves.pop()
        }

        this.initGame()
      }
    })

    document.getElementById('show_score').addEventListener('change', () => {
      this.showScore()
    })
    document.getElementById('search_next').addEventListener('change', () => {
      this.render()
    })
  }

  placeDisk(col, row, test = false) {
    if (this.disks[row][col] !== 0) {
      return
    }

    const dirs = [
      { x: 0, y: -1 },
      { x: 1, y: -1 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: -1, y: 1 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
    ]

    // 8方向をチェックするので、その数ぶんループを回す
    for (let i = 0; i < dirs.length; i++) {
      let targetRow = row + dirs[i].y
      let targetCol = col + dirs[i].x

      // 隣の石が相手の色でない場合は、その回のループを終了
      if (targetRow < 0 || targetRow >= 8) {
        continue
      }
      if (targetCol < 0 || targetCol >= 8) {
        continue
      }
      if (this.disks[targetRow][targetCol] !== -this.turn) {
        continue
      }

      // 相手の色が出る限りターゲットを同じ方向に進め、その途中で盤の外に出た場合は終了
      while (this.disks[targetRow][targetCol] === -this.turn) {
        targetRow += dirs[i].y
        targetCol += dirs[i].x

        // これを書かないとwhileの条件式を実行したときにエラーが出る
        if (targetRow < 0 || targetRow >= 8) {
          break
        }
        if (targetCol < 0 || targetCol >= 8) {
          break
        }
      }

      // 相手の石の先でターゲットが盤の外に出るか、まだ空白のマスだったら終了
      if (targetRow < 0 || targetRow >= 8) {
        continue
      }
      if (targetCol < 0 || targetCol >= 8) {
        continue
      }
      if (this.disks[targetRow][targetCol] === 0) {
        continue
      }

      // ターゲットが自分の石だったら、間にあった石をひっくり返しながら元の位置まで戻る
      if (this.disks[targetRow][targetCol] === this.turn) {
        if (!test) {
          targetRow -= dirs[i].y
          targetCol -= dirs[i].x

          while (this.disks[targetRow][targetCol] === -this.turn) {
            this.disks[targetRow][targetCol] = this.turn
            targetRow -= dirs[i].y
            targetCol -= dirs[i].x
          }
          this.disks[row][col] = this.turn
        }

        // ここでreturn trueを使わないのは、for文を最後まで回す必要があるから
        this.success = true
      }
    }

    return this.success
  }
}

new Reversi()

// Coded by Yusuke196