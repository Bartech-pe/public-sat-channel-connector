interface TdEntity {
  _: 'textEntity';
  offset: number;
  length: number;
  type:
    | { _: 'textEntityTypeBold' }
    | { _: 'textEntityTypeItalic' }
    | { _: 'textEntityTypeTextUrl'; url: string };
}

interface FormattedText {
  _: 'formattedText';
  text: string;
  entities: TdEntity[];
}

export function markdownToEntitiesAuto(markdown: string): FormattedText {
  if (!markdown) return { _: 'formattedText', text: '', entities: [] };

  let text = '';
  const entities: TdEntity[] = [];

  let cursor = 0; // posición en el texto resultante

  // Expresión para **bold**, _italic_ o [link](url)
  const regex =
    /(\*\*([^\*]+)\*\*)|(_([^_]+)_)|(\[([^\]]+)\]\(([^)]+)\))/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    // Agrega texto previo
    if (match.index > lastIndex) {
      const chunk = markdown.slice(lastIndex, match.index);
      text += chunk;
      cursor += chunk.length;
    }

    if (match[2]) {
      // **negrita**
      const boldText = match[2];
      entities.push({
        _: 'textEntity',
        offset: cursor,
        length: boldText.length,
        type: { _: 'textEntityTypeBold' },
      });
      text += boldText;
      cursor += boldText.length;
    } else if (match[4]) {
      // _cursiva_
      const italicText = match[4];
      entities.push({
        _: 'textEntity',
        offset: cursor,
        length: italicText.length,
        type: { _: 'textEntityTypeItalic' },
      });
      text += italicText;
      cursor += italicText.length;
    } else if (match[7]) {
      // [texto](url)
      const linkText = match[6];
      const url = match[7];
      entities.push({
        _: 'textEntity',
        offset: cursor,
        length: linkText.length,
        type: { _: 'textEntityTypeTextUrl', url },
      });
      text += linkText;
      cursor += linkText.length;
    }

    lastIndex = regex.lastIndex;
  }

  // Texto restante
  if (lastIndex < markdown.length) {
    const rest = markdown.slice(lastIndex);
    text += rest;
  }

  return { _: 'formattedText', text, entities };
}
