// helpers

type Direction = 1 | -1
const CONTENTEDITABLE_SELECTOR = '[contenteditable=true]'

const helpers = {
    isSpace(char: string) {
        return /\s/.test(char)
    },

    isBlock(el: Node) {
        if (el instanceof HTMLElement) {
            return ['block', 'flex'].indexOf(el.style.display) > -1
        }
        return false
    },

    findSelectableInNode(node: Node) {
        const contentEditableList: HTMLElement[] = []
        // Use .addBack() to include self
        const res = (node as Node).nodeType == Node.TEXT_NODE ?
            $(node) : $(node).find("*").addBack().contents().filter(function () {
                if ((this as HTMLElement).isContentEditable) {
                    contentEditableList.push(this as HTMLElement)
                }
                return this.nodeType == Node.TEXT_NODE
            })
        if (res.length == 0) {
            return $(contentEditableList)
        }
        return res
    },

    eachSelfAndParents(node: Node, handler: (this: HTMLElement, index: number, element: HTMLElement) => void | false) {
        return $($(node).parents().addBack().toArray().reverse()).each(
            handler
            // function (index, element) {
            //     if (this instanceof HTMLElement && !this.isContentEditable) {
            //         return false
            //     }
            //     return handler.call(this, index, element)
            // }
        )
    },

    isEditable(node: Node) {
        if (node.nodeType == Node.TEXT_NODE) {
            return true
        }
        if (node instanceof HTMLElement) {
            if (node.isContentEditable) {
                return true
            }
            if (node.querySelectorAll(CONTENTEDITABLE_SELECTOR).length > 0) {
                return true
            }
        }
        return false
    }
}

class EditorBuddyContent {
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

    public moveToEndOfLine() {
        throw new Error("Method not implemented.");
    }

    public moveToStartOfLine() {
        throw new Error("Method not implemented.");
    }

    public moveUp() {
        this.moveCursorVertically(-1)
    }

    public moveDown() {
        this.moveCursorVertically(1)
    }

    public moveLeft(byWord: boolean) {
        this.moveCursorHorizontally(-1, byWord)
    }

    public moveRight(byWord: boolean) {
        this.moveCursorHorizontally(1, byWord)
    }

    /** 
     * @param direction: 1 for down, -1 for up
     */
    private moveCursorVertically(direction: Direction) {
        console.log('move cursor vertically', direction)
        const sel = this.win.getSelection()
        if (!sel || sel.rangeCount <= 0) {
            return
        }
        const textNode = sel.focusNode
        if (!(textNode instanceof Text)) {
            return
        }

    }

    /** 
     * @param direction: 1 for forward, -1 for backward
     * @param byWord: move by a word or a character
     */
    private moveCursorHorizontally(direction: Direction, byWord: boolean) {
        console.log('move cursor horizontally', direction, byWord)
        const sel = this.win.getSelection();
        if (!sel || sel.rangeCount <= 0) {
            return
        }
        const node = sel.focusNode!
        // if (!(textNode instanceof Text)) {
        //     return
        // }
        const text = node instanceof HTMLElement ? node.innerText : node.nodeValue!
        if (direction == 1 && sel.focusOffset >= text.length) {
            this.moveToNextNode(sel, byWord)
            return
        }
        if (direction == -1 && sel.focusOffset <= 0) {
            this.moveToPreviousNode(sel, byWord)
            return
        }
        let offset = -1
        if (byWord) {
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
        sel.collapse(node, offset);
    }

    private moveToPreviousNode(sel: Selection, byWord: boolean) {
        let sameBlock = true
        let node: Node | null = null
        helpers.eachSelfAndParents(sel.focusNode!, function () {
            if (helpers.isBlock(this)) {
                sameBlock = false
            }
            if (this.previousSibling && helpers.isEditable(this.previousSibling)) {
                node = this.previousSibling
                return false
            }
        })
        if (!node) {
            return
        }
        const selectable = helpers.findSelectableInNode(node).last()[0]
        if (!selectable) {
            this.moveToPreviousNode(sel, byWord)
            return
        }
        const len = selectable instanceof HTMLElement ? selectable.innerText.length : selectable.nodeValue!.length
        sel.collapse(selectable, len)
        if (sameBlock) {
            this.moveLeft(byWord)
        }
    }

    private moveToNextNode(sel: Selection, byWord: boolean) {
        let sameBlock = true
        const focusNode = sel.focusNode!
        let selectable: Node | null = null
        selectable = helpers
            .findSelectableInNode(focusNode)
            .filter(function () { return this != focusNode })[0]
        if (!selectable) {
            let node: Node | null = null
            helpers.eachSelfAndParents(focusNode, function () {
                if (helpers.isBlock(this)) {
                    sameBlock = false
                }
                if (this.nextSibling && helpers.isEditable(this.nextSibling)) {
                    node = this.nextSibling
                    return false
                }
            })
            if (!node) {
                return
            }
            node = node as Node
            selectable = helpers.findSelectableInNode(node)[0]
            if (!selectable) {
                this.moveToNextNode(sel, byWord)
                return
            }
        }
        sel.collapse(selectable, 0)
        if (sameBlock) {
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

new EditorBuddyContent()