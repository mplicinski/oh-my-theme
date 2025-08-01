export const defaultTheme = {
  $schema: 'https://raw.githubusercontent.com/JanDeDobbeleer/oh-my-posh/main/themes/schema.json',
  blocks: [
    {
      alignment: 'left',
      segments: [
        {
          background: '#546E7A',
          foreground: '#26C6DA',
          style: 'plain',
          template: ' {{ if .WSL }}WSL at {{ end }}{{.Icon}} \ue0b1',
          type: 'os',
        },
        {
          background: '#546E7A',
          foreground: '#26C6DA',
          style: 'plain',
          template: ' \uf0e7 ',
          type: 'root',
        },
        {
          background: '#546E7A',
          foreground: '#26C6DA',
          properties: {
            style: 'full',
          },
          style: 'plain',
          template: ' {{ .Path }} ',
          type: 'path',
        },
        {
          background: '#546E7A',
          foreground: '#D4E157',
          style: 'plain',
          template: '<#26C6DA>\ue0b1 </>{{ .HEAD }} ',
          type: 'git',
        },
        {
          background: 'transparent',
          foreground: '#546E7A',
          style: 'plain',
          template: '\ue0b0',
          type: 'text',
        },
      ],
      type: 'prompt',
    },
    {
      alignment: 'right',
      segments: [
        {
          background: '#546E7A',
          foreground: '#D4E157',
          leading_diamond: '\ue0b2',
          style: 'diamond',
          template: ' {{ .UserName }}@{{ .HostName }} <#26C6DA>\ue0b3</> ',
          type: 'session',
        },
        {
          background: '#546E7A',
          foreground: '#D4E157',
          properties: {
            time_format: '15:04:05',
          },
          style: 'plain',
          template: ' {{ .CurrentDate | date .Format }} \uf017 ',
          type: 'time',
        },
      ],
      type: 'prompt',
    },
    {
      alignment: 'left',
      newline: true,
      segments: [
        {
          foreground: '#D4E157',
          foreground_templates: ['{{ if gt .Code 0 }}#FF5252{{ end }}'],
          properties: {
            always_enabled: true,
          },
          style: 'plain',
          template: '\u276f ',
          type: 'status',
        },
      ],
      type: 'prompt',
    },
  ],
  version: 3,
}
