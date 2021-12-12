// helpers

type Direction = 1 | -1

const helpers = {
    isSpace(char: string) {
        return /\s/.test(char)
    },

    isBlock(el: Node) {
        if (el instanceof HTMLElement) {
            return ['block', 'flex'].indexOf(el.style.display) > -1
        }
        return false
    }
}

class App {
    win: Window
    constructor() {
        this.win = window
        window.onkeydown = (e: KeyboardEvent) => {
            if (!e.altKey) {
                return
            }
            let moveByWord = e.ctrlKey
            switch (e.code) {
                case 'KeyI':
                    this.moveUp()
                    break;
                case 'KeyK':
                    this.moveDown()
                    break;
                case 'KeyJ':
                    this.moveLeft(moveByWord)
                    break;
                case 'KeyL':
                    this.moveRight(moveByWord)
                    break;
                case 'KeyA':
                    this.moveToStartOfLine()
                    break
                case 'KeyE':
                    this.moveToEndOfLine()
                    break
            }
        };
        console.log('ready')
    }

    moveToEndOfLine() {
        throw new Error("Method not implemented.");
    }

    moveToStartOfLine() {
        throw new Error("Method not implemented.");
    }

    moveUp() {
        this.moveCursorVertically(-1)
    }

    moveDown() {
        this.moveCursorVertically(1)
    }

    moveLeft(byWord: boolean) {
        this.moveCursorHorizontally(-1, byWord)
    }

    moveRight(byWord: boolean) {
        this.moveCursorHorizontally(1, byWord)
    }

    /** 
     * @param direction: 1 for down, -1 for up
     */
    private moveCursorVertically(direction: Direction) {
        console.log('move caret horizontally', direction)
    }

    /** 
     * @param direction: 1 for forward, -1 for backward
     */
    private moveCursorHorizontally(direction: Direction, byWord: boolean) {
        console.log('move caret horizontally', direction, byWord)
        const sel = this.win.getSelection();
        if (!sel || sel.rangeCount <= 0) {
            return
        }
        const textNode = sel.focusNode
        if (!(textNode instanceof Text)) {
            return
        }
        if (direction == 1 && sel.focusOffset >= textNode.length) {
            this.moveToNextNode(sel, byWord)
            return
        }
        if (direction == -1 && sel.focusOffset <= 0) {
            this.moveToPreviousNode(sel, byWord)
            return
        }
        let offset = -1
        if (byWord) {
            const text = textNode.nodeValue!
            const wordMarks = this.findWordMarks(text, direction)
            if (direction == 1) {
                // forward
                for (let i = 0; i < wordMarks.length; i++) {
                    if (wordMarks[i] > sel.focusOffset) {
                        offset = wordMarks[i]
                        break
                    }
                }
                if (offset == -1) {
                    offset = text.length
                }
            } else {
                // backward
                for (let i = wordMarks.length - 1; i >= 0; i--) {
                    if (wordMarks[i] < sel.focusOffset) {
                        offset = wordMarks[i]
                        break
                    }
                }
                if (offset == -1) {
                    offset = 0
                }
            }
        } else {
            offset = sel.focusOffset + direction
        }
        sel.collapse(textNode, offset);
    }

    private moveToPreviousNode(sel: Selection, byWord: boolean) {
        let focusNode = sel.focusNode!
        let sameLine = true
        let node: Node | null = null
        $($(focusNode).parents().addBack().toArray().reverse()).each(function () {
            if (helpers.isBlock(this)) {
                sameLine = false
            }
            if (this.previousSibling) {
                node = this.previousSibling
                return false
            }
        })
        if (!node) {
            return
        }
        // Use .addBack() to include self
        const text = (node as Node).nodeType == Node.TEXT_NODE ?
            node : $(node).find("*").addBack().contents().filter(function () {
                return this.nodeType == Node.TEXT_NODE && this.nodeValue!.length > 0
            }).last()[0]
        if (!text) {
            return
        }
        sel.collapse(text, text.nodeValue!.length)
        if (sameLine) {
            this.moveLeft(byWord)
        }
    }

    private moveToNextNode(sel: Selection, byWord: boolean) {
        let focusNode = sel.focusNode!
        let sameLine = true
        let node: Node | null = null
        $($(focusNode).parents().addBack().toArray().reverse()).each(function () {
            if (helpers.isBlock(this)) {
                sameLine = false
            }
            if (this.nextSibling) {
                node = this.nextSibling
                return false
            }
        })
        if (!node) {
            return
        }
        // Use .addBack() to include self
        const text = (node as Node).nodeType == Node.TEXT_NODE ?
            node : $(node).find("*").addBack().contents().filter(function () {
                return this.nodeType == Node.TEXT_NODE && this.nodeValue!.length > 0
            })[0]
        if (!text) {
            return
        }
        sel.collapse(text, 0)
        if (sameLine) {
            this.moveRight(byWord)
        }
    }

    private findWordMarks(text: string, direction: Direction) {
        const wordMarks = []
        let wordStarted = !helpers.isSpace(text[0])
        for (let i = 0; i < text.length; i++) {
            let isSpace = helpers.isSpace(text[i])
            if (wordStarted && isSpace) {
                wordStarted = false
            }
            if (!wordStarted && !isSpace) {
                wordStarted = true
                wordMarks.push(i)
            }
        }
        // To match the default behavior
        // If move forward, and current line ends with spaces, add the end index of last word to list
        if (direction == 1 && wordMarks.length > 0 && helpers.isSpace(text[text.length - 1])) {
            wordMarks.push(/(\s+)$/.exec(text)!.index)
        }
        return wordMarks
    }
}

new App()