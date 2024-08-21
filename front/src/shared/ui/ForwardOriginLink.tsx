import React from 'react';

const ForwardOriginLink = ({ selectedEntry }:any) => {
  const { forward_origin } = selectedEntry;

  if (!forward_origin) return null;

  let content;

  switch (forward_origin.type) {
    case 'channel':
      content = (
        <>
          Channel:{' '}
          {forward_origin.username ? (
            <a
              className="font-bold text-cyan-500 ml-2"
              href={`https://t.me/${forward_origin.username}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e=>e.stopPropagation()}
            >
              {forward_origin.title}
            </a>
          ) : (
            <span className="font-bold text-white ml-2">{forward_origin.title}</span>
          )}
        </>
      );
      break;
    case 'user':
      content = (
        <>
          User:{' '}
          {forward_origin.username ? (
            <a
              className="font-bold text-cyan-500 ml-2"
              href={`https://t.me/${forward_origin.username}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e=>e.stopPropagation()}

            >
              {forward_origin.title}
            </a>
          ) : (
            <span className="font-bold text-white ml-2">{forward_origin.title}</span>
          )}
        </>
      );
      break;
    case 'hidden_user':
      content = (
        <>
          User (hidden):{' '}
          {forward_origin.username ? (
            <a
              className="font-bold text-cyan-500 ml-2"
              href={`https://t.me/${forward_origin.username}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e=>e.stopPropagation()}

            >
              {forward_origin.title}
            </a>
          ) : (
            <span className="font-bold text-white ml-2">{forward_origin.title}</span>
          )}
        </>
      );
      break;
    case 'self':
      content = (
        <>
          Source: <span className="font-bold text-white ml-2">Администратор</span>
        </>
      );
      break;
    case 'diary':
      content = (
        <>
          Source: <span className="font-bold text-white ml-2">Дневник</span>
        </>
      );
      break;
    case 'editor':
      content = (
        <>
          Source: <span className="font-bold text-white ml-2">Редактор</span>
        </>
      );
      break;
    default:
      content = (
        <>
          Source: <span className="font-bold text-white ml-2">Unknown</span>
        </>
      );
  }

  return <h6 className="flex font-bold mb-2">{content}</h6>;
};

export default ForwardOriginLink;