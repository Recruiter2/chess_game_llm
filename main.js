class Piece {
            constructor(type, color, position) {
                this.type = type;
                this.color = color;
                this.position = position;
                this.hasMoved = false;
            }

            get symbol() {
                const symbols = {
                    king: '♚',
                    queen: '♛',
                    rook: '♜',
                    bishop: '♝',
                    knight: '♞',
                    pawn: '♟'
                };
                let res ='';


                res = symbols[this.type]
                //inverse operation Array.from("♕", (codeUnit) => codeUnit.codePointAt())
                //console.log(Array.from("♛", (codeUnit) => codeUnit.codePointAt()));
                if (this.color != 'black') {
                    res = '<span style="color: #ffffff;">' + symbols[this.type] + '</span>'
                }
                return res
            }


        }

        class Board {
            constructor() {
                this.squares = Array(8).fill().map(() => Array(8).fill(null));
                this.initBoard();
                this.currentTurn = 'white';
                this.selectedPiece = null;
                this.possibleMoves = [];
                this.gameOver = false;
            }

            initBoard() {
                // Initialize pawns
                for (let i = 0; i < 8; i++) {
                    this.squares[1][i] = new Piece('pawn', 'black', [1, i]);
                    this.squares[6][i] = new Piece('pawn', 'white', [6, i]);
                    
                }

                // Initialize other pieces
                const pieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
                pieces.forEach((piece, i) => {
                    this.squares[0][i] = new Piece(piece, 'black', [0, i]);
                    this.squares[7][i] = new Piece(piece, 'white', [7, i]);
                });
            }

            getKingPosition(color) {
                for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                        const piece = this.squares[row][col];
                        if (piece && piece.type === 'king' && piece.color === color) {
                            return [row, col];

                        }
                    }
                }
                return null;
            }

            isCheck(color) {
                const kingPos = this.getKingPosition(color);
                return this.isSquareAttacked(kingPos, color);
            }

            isCheckmate(color) {
                if (!this.isCheck(color)) return false;
                return this.getAllValidMoves(color).length === 0;
            }

            isStalemate(color) {
                if (this.isCheck(color)) return false;
                return this.getAllValidMoves(color).length === 0;
            }

            isSquareAttacked(position, defenderColor) {
                const attackerColor = defenderColor === 'white' ? 'black' : 'white';
                
                for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                        const piece = this.squares[row][col];
                        if (piece && piece.color === attackerColor) {
                            const moves = this.getPossibleMoves(piece, false);
                            if (moves.some(([r, c]) => r === position[0] && c === position[1])) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            }

            getAllValidMoves(color) {
                const moves = [];
                for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                        const piece = this.squares[row][col];
                        if (piece && piece.color === color) {
                            const validMoves = this.getValidMoves(piece);
                            validMoves.forEach(move => {
                                moves.push({
                                    from: [row, col],
                                    to: move
                                });
                            });
                        }
                    }
                }
                return moves;
            }

            getValidMoves(piece) {
                const possibleMoves = this.getPossibleMoves(piece);
                return possibleMoves.filter(move => {
                    const copyBoard = this.clone();
                    copyBoard.movePiece(piece.position, move);
                    return !copyBoard.isCheck(piece.color);
                });
            }

            getPossibleMoves(piece, checkKingSafety = true) {
                const moves = [];
                const [row, col] = piece.position;

                switch (piece.type) {
                    case 'pawn':
                        const direction = piece.color === 'white' ? -1 : 1;
                        const startRow = piece.color === 'white' ? 6 : 1;
                        
                        // Forward moves
                        if (this.isValidSquare(row + direction, col) && !this.squares[row + direction][col]) {
                            moves.push([row + direction, col]);
                            if (row === startRow && !this.squares[row + 2 * direction][col]) {
                                moves.push([row + 2 * direction, col]);
                            }
                        }

                        // Captures
                        [[direction, -1], [direction, 1]].forEach(([dr, dc]) => {
                            const newRow = row + dr;
                            const newCol = col + dc;
                            if (this.isValidSquare(newRow, newCol)) {
                                const target = this.squares[newRow][newCol];
                                if (target && target.color !== piece.color) {
                                    moves.push([newRow, newCol]);
                                }
                            }
                        });
                        break;

                    case 'knight':
                        const knightMoves = [
                            [2, 1], [2, -1], [-2, 1], [-2, -1],
                            [1, 2], [1, -2], [-1, 2], [-1, -2]
                        ];
                        knightMoves.forEach(([dr, dc]) => {
                            const newRow = row + dr;
                            const newCol = col + dc;
                            if (this.isValidSquare(newRow, newCol) && 
                               (!this.squares[newRow][newCol] || this.squares[newRow][newCol].color !== piece.color)) {
                                moves.push([newRow, newCol]);
                            }
                        });
                        break;

                    case 'bishop':
                        this.addDirectionalMoves(moves, piece, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
                        break;

                    case 'rook':
                        this.addDirectionalMoves(moves, piece, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
                        break;

                    case 'queen':
                        this.addDirectionalMoves(moves, piece, [
                            [-1, 0], [1, 0], [0, -1], [0, 1],
                            [-1, -1], [-1, 1], [1, -1], [1, 1]
                        ]);
                        break;

                    case 'king':
                        const kingMoves = [
                            [-1, -1], [-1, 0], [-1, 1],
                            [0, -1],         [0, 1],
                            [1, -1],  [1, 0], [1, 1]
                        ];
                        kingMoves.forEach(([dr, dc]) => {
                            const newRow = row + dr;
                            const newCol = col + dc;
                            if (this.isValidSquare(newRow, newCol) && 
                               (!this.squares[newRow][newCol] || this.squares[newRow][newCol].color !== piece.color)) {
                                moves.push([newRow, newCol]);
                            }
                        });
                        break;
                }

                return moves.filter(move => {
                    if (!checkKingSafety) return true;
                    const copyBoard = this.clone();
                    copyBoard.movePiece(piece.position, move);
                    return !copyBoard.isCheck(piece.color);
                });
            }

            addDirectionalMoves(moves, piece, directions) {
                const [row, col] = piece.position;
                
                directions.forEach(([dr, dc]) => {
                    let newRow = row + dr;
                    let newCol = col + dc;
                    
                    while (this.isValidSquare(newRow, newCol)) {
                        const target = this.squares[newRow][newCol];
                        
                        if (!target) {
                            moves.push([newRow, newCol]);
                        } else {
                            if (target.color !== piece.color) {
                                moves.push([newRow, newCol]);
                            }
                            break;
                        }
                        
                        newRow += dr;
                        newCol += dc;
                    }
                });
            }

            isValidSquare(row, col) {
                return row >= 0 && row < 8 && col >= 0 && col < 8;
            }

            movePiece(from, to) {
                const [fromRow, fromCol] = from;
                const [toRow, toCol] = to;
                const piece = this.squares[fromRow][fromCol];
                
                if (!piece) return false;

                // Handle pawn promotion
                if (piece.type === 'pawn' && ((piece.color === 'white' && toRow === 0) || 
                   (piece.color === 'black' && toRow === 7))) {
                    piece.type = 'queen';
                }

                this.squares[toRow][toCol] = piece;
                this.squares[fromRow][fromCol] = null;
                piece.position = [toRow, toCol];
                piece.hasMoved = true;
                return true;
            }

            clone() {
                const clone = new Board();
                clone.squares = this.squares.map(row => 
                    row.map(piece => piece ? new Piece(piece.type, piece.color, [...piece.position]) : null)
                );
                clone.currentTurn = this.currentTurn;
                return clone;
            }
        }

        class Game {
            constructor() {
                this.board = new Board();
                this.aiColor = 'black';
                this.setupBoard();
                this.updateStatus();
            
            }

            setupBoard() {
                const boardElement = document.getElementById('board');
                boardElement.innerHTML = '';
                
                for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                        const square = document.createElement('div');
                        square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                        square.dataset.row = row;
                        square.dataset.col = col;
                        square.addEventListener('click', (e) => this.handleSquareClick(e));
                        boardElement.appendChild(square);
                    }
                }
                this.updateBoard();
            }

            updateBoard() {
                document.querySelectorAll('.square').forEach(square => {
                    const row = parseInt(square.dataset.row);
                    const col = parseInt(square.dataset.col);
                    const piece = this.board.squares[row][col];
                    square.innerHTML = piece ? piece.symbol : '';
                    square.querySelectorAll('.possible-move').forEach(m => m.remove());

                });

                this.board.possibleMoves.forEach(([r, c]) => {
                    const square = document.querySelector(`.square[data-row="${r}"][data-col="${c}"]`);
                    const moveIndicator = document.createElement('div');
                    moveIndicator.className = 'possible-move';
                    square.appendChild(moveIndicator);
                });
            }

            updateStatus() {
                const statusElement = document.getElementById('status');
                if (this.board.gameOver) {
                    statusElement.textContent = 'Game Over!';
                    return;
                }

                if (this.board.isCheckmate(this.board.currentTurn)) {
                    statusElement.textContent = `Checkmate! ${this.board.currentTurn === 'white' ? 'Black' : 'White'} wins!`;
                    this.board.gameOver = true;
                } else if (this.board.isStalemate(this.board.currentTurn)) {
                    statusElement.textContent = 'Stalemate!';
                    this.board.gameOver = true;
                } else if (this.board.isCheck(this.board.currentTurn)) {
                    statusElement.textContent = `${this.board.currentTurn}'s turn - Check!`;
                } else {
                    statusElement.textContent = `${this.board.currentTurn}'s turn`;
                }
            }

            handleSquareClick(event) {
				if (this.board.gameOver || 
				   (this.board.currentTurn === this.aiColor && !this.board.selectedPiece)) return;

				// Get the actual square element even when clicking on the possible-move dot
				const squareElement = event.target.closest('.square');
				if (!squareElement) return;

				const row = parseInt(squareElement.dataset.row);
				const col = parseInt(squareElement.dataset.col);
				const piece = this.board.squares[row][col];

				if (this.board.selectedPiece) {
					if (this.board.possibleMoves.some(([r, c]) => r === row && c === col)) {
						this.makeMove([this.board.selectedPiece.position, [row, col]]);
						
						if (!this.board.gameOver && this.board.currentTurn === this.aiColor) {
							setTimeout(() => this.aiMove(), 500);
						}
					}
					this.board.selectedPiece = null;
					this.board.possibleMoves = [];
				} else if (piece && piece.color === this.board.currentTurn) {
					this.board.selectedPiece = piece;
					this.board.possibleMoves = this.board.getValidMoves(piece);
				}

				this.updateBoard();
				document.querySelectorAll('.square').forEach(sq => sq.classList.remove('selected'));
				if (this.board.selectedPiece) {
					const selectedSquare = document.querySelector(
						`.square[data-row="${this.board.selectedPiece.position[0]}"][data-col="${this.board.selectedPiece.position[1]}"]`
					);
					selectedSquare.classList.add('selected');
				}
			}

            makeMove([from, to]) {
                this.board.movePiece(from, to);
                this.board.currentTurn = this.board.currentTurn === 'white' ? 'black' : 'white';
                this.updateStatus();
            }

            aiMove() {
				const pieceValues = {
					pawn: 1,
					knight: 3,
					bishop: 3,
					rook: 5,
					queen: 9,
					king: 0
				};

				const moves = this.board.getAllValidMoves(this.aiColor);
				if (moves.length === 0) return;

				const evaluatedMoves = moves.map(move => {
					const copiedBoard = this.board.clone();
					const from = move.from;
					const to = move.to;
					const movedPiece = copiedBoard.squares[from[0]][from[1]];
					const targetPiece = copiedBoard.squares[to[0]][to[1]];

					copiedBoard.movePiece(from, to);
					copiedBoard.currentTurn = copiedBoard.currentTurn === 'white' ? 'black' : 'white';

					let score = 0;
					const isCheckmate = copiedBoard.isCheckmate(copiedBoard.currentTurn);
					const isCheck = copiedBoard.isCheck(copiedBoard.currentTurn);
					const capturedValue = targetPiece ? pieceValues[targetPiece.type] : 0;
					const isAttacked = copiedBoard.isSquareAttacked(to, copiedBoard.currentTurn);

					// Checkmate and check bonuses
					if (isCheckmate) {
						score += 1000;
					} else if (isCheck) {
						score += 100;
					}

					// Material gain
					score += capturedValue;

					// Penalize moving into attacked squares
					if (isAttacked) {
						score -= pieceValues[movedPiece.type];
					}

					// Pawn advancement bonus
					if (movedPiece.type === 'pawn') {
						const startRow = movedPiece.color === 'white' ? 6 : 1;
						const advancement = Math.abs(to[0] - startRow);
						score += advancement * 0.3;
					}

					// Threat detection bonus
					const attackMoves = copiedBoard.getPossibleMoves(movedPiece, false);
					const threatSquares = attackMoves.filter(([r, c]) => {
						const target = copiedBoard.squares[r][c];
						return target && target.color !== movedPiece.color;
					});
					const threatScore = threatSquares.reduce((sum, [r, c]) => {
						return sum + (pieceValues[copiedBoard.squares[r][c].type] * 0.4);
					}, 0);
					score += threatScore;

					// King safety evaluation
					const aiKingPos = copiedBoard.getKingPosition(this.aiColor);
					let kingSafetyScore = 0;
					const kingDirections = [
						[-1, -1], [-1, 0], [-1, 1],
						[0, -1],  [0, 1],
						[1, -1],  [1, 0], [1, 1]
					];
					kingDirections.forEach(([dr, dc]) => {
						const r = aiKingPos[0] + dr;
						const c = aiKingPos[1] + dc;
						if (copiedBoard.isValidSquare(r, c) && copiedBoard.isSquareAttacked([r, c], this.aiColor)) {
							kingSafetyScore -= 0.6;
						}
					});
					score += kingSafetyScore;

					// Bishop mobility bonus
					if (movedPiece.type === 'bishop') {
						const mobility = copiedBoard.getPossibleMoves(movedPiece).length;
						score += mobility * 0.15;
					}

					// Rook open file bonus
					if (movedPiece.type === 'rook') {
						const file = to[1];
						let isOpen = true;
						for (let r = 0; r < 8; r++) {
							if (copiedBoard.squares[r][file]?.type === 'pawn') {
								isOpen = false;
								break;
							}
						}
						if (isOpen) score += 0.8;
					}

					// Knight outpost bonus
					if (movedPiece.type === 'knight') {
						const [r, c] = to;
						const enemyPawnDir = movedPiece.color === 'white' ? 1 : -1;
						const attackSquares = [
							[r + enemyPawnDir, c - 1],
							[r + enemyPawnDir, c + 1]
						];
						const isOutpost = !attackSquares.some(([pr, pc]) => 
							copiedBoard.isValidSquare(pr, pc) && 
							copiedBoard.squares[pr][pc]?.type === 'pawn' && 
							copiedBoard.squares[pr][pc].color !== movedPiece.color
						);
						if (isOutpost) score += 0.6;
					}

					return { move, score };
				});

				// Select best move with some randomness
				evaluatedMoves.sort((a, b) => b.score - a.score);
				const topMoves = evaluatedMoves.slice(0, 3).filter(m => m.score === evaluatedMoves[0].score);
				const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)].move;

				this.makeMove([selectedMove.from, selectedMove.to]);
				this.updateBoard();
			}

            reset() {
                this.board = new Board();
                this.setupBoard();
                this.updateStatus();
            }
        }

        const game = new Game();