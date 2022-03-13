let s:namespace = has('nvim') ? nvim_create_namespace('ddu-ui-preview') : 0

function! ddu#ui#preview#_open_list_window(bufnr, uiParams) abort
  echomsg a:uiParams
  let l:no_border = type(a:uiParams.border) == v:t_string
        \ && a:uiParams.border == 'none'
  let l:width = float2nr(&columns * a:uiParams.winWidthRate)
  let l:height = float2nr(&lines * a:uiParams.winHeightRate)
  let l:options = {
        \ 'relative': 'editor',
        \ 'width': float2nr(l:width / 2) - (l:no_border ? 0 : 1),
        \ 'height': l:height - (l:no_border ? 1 : 4),
        \ 'row': (&lines - l:height) / 2 + (l:no_border
        \                                   ? (a:uiParams.promptPosition == 'bottom' ? 0 : 1)
        \                                   : (a:uiParams.promptPosition == 'bottom' ? 0 : 2)),
        \ 'col': (&columns - l:width) / 2,
        \ 'border': a:uiParams.border,
        \ 'anchor': 'NW',
        \ }
  let l:winid = nvim_open_win(a:bufnr, v:false, l:options)
  return l:winid
endfunction

" call s:open_list_window(nvim_create_buf(v:false, v:true), 1.0, 1.0, 'rounded')
