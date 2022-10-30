export class Message {
  id
  content: string
  author: string

  constructor(id, {content, author}) {
    this.id = id;
    this.content = content;
    this.author = author;
  }
}
