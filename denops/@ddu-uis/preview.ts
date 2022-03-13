import {
  ActionFlags,
  BaseUi,
  Context,
  DduItem,
  DduOptions,
  UiActions,
  UiOptions,
} from "https://deno.land/x/ddu_vim@v1.2.0/types.ts";
import {
  batch,
  Denops,
  fn,
  op,
  vars,
} from "https://deno.land/x/ddu_vim@v1.2.0/deps.ts";
import {
  assertArray,
  assertNumber,
  assertString,
  ensureArray,
  ensureNumber,
  ensureString,
  isNumber,
  isString,
} from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";

type BorderOption = {
  topLeft: string;
  topRight: string;
  top: string;
  bottomLeft: string;
  bottomRight: string;
  bottom: string;
  left: string;
  right: string;
};

type Params = {
  autoPreview: boolean;
  border:
    | "none"
    | "single"
    | "double"
    | "rounded"
    | "solid"
    | "shadow"
    | BorderOption;
  highlights: string;
  prompt: string;
  promptPosition: "top" | "bottom";
  split: "horizontal" | "vertical";
  winHeightRate: number;
  winWidthRate: number;
};

export class Ui extends BaseUi<params> {
  private buffers: Record<string, number> = {};
  private items: DduItem[] = [];
  private refreshed = false;
  private prevLength = -1;
  private saveCursor: number[] = [];

  refreshItems(args: {
    items: DduItem[];
  }): void {
    this.prevLength = this.items.length;
    this.items = args.items.slice(0, 1000);
    this.refreshed = true;
  }

  async redraw(args: {
    denops: Denops;
    context: Context;
    options: DduOptions;
    uiOptions: UiOptions;
    uiParams: Params;
  }): Promise<void> {
    if (args.context.maxItems == 0) {
      return;
    }
    const bufferName = `ddu-preview`;
    const initialized = this.buffers[args.options.name];
    const bufnr = initialized
      ? this.buffers[args.options.name]
      : await this.initBuffer(args.denops, bufferName);
    this.buffers[args.options.name] = bufnr;

    await fn.setbufvar(args.denops, bufnr, "&modifiable", 1);

    const ids = ensureArray(await fn.win_findbuf(args.denops, bufnr), isNumber);

    if (ids.length == 0) {
      const winid = ensureNumber(
        await args.denops.call(
          "ddu#ui#preview#_open_list_window",
          bufnr,
          args.uiParams,
        ),
      );
      await fn.setwinvar(
        args.denops,
        winid,
        "&winhighlight",
        args.uiParams.highlights,
      );
    }

    if (this.refreshed) {
      // await this.initOptions(args.denops, args.options, bufnr);
    }

    const header =
      `[ddu-${args.options.name}] ${this.items.length}/${args.context.maxItems}`;
    const linenr = "printf('%'.(len(line('$'))+2).'d/%d',line('$'))";
    const async = `${args.context.done ? "" : "[async]"}`;
    const lastStatus = await op.laststatus.get(args.denops);
    if (args.denops.meta.host == "nvim") {
      args.denops.call(
        "nvim_set_option",
        "titlestring",
        header + " %#LineNR#%{" + linenr + "}%*" + async,
      );
    } else {
      await fn.setwinvar(
        args.denops,
        await fn.bufwinnr(args.denops, bufnr),
        "&statusline",
        header + " %#LineNR#%{" + linenr + "}%*" + async,
      );
    }

    const displaySourceName = "";
    const promptPrefix = "";
    const cursorPos = 0;

    //update buffer
    await fn.setbufvar(args.denops, bufnr, "&modifiable", 1);
    const lines = this.items.map((c) => c.display ?? c.word);
    await fn.setbufline(args.denops, bufnr, 1, lines);
    await args.denops.cmd(
      `silent call deletebufline(${bufnr}, ${lines.length + 1}, '$')`,
    );
    await fn.setbufvar(args.denops, bufnr, "&modifiable", 0);
    await fn.setbufvar(args.denops, bufnr, "&modified", 0);
    if (this.refreshed) {
      await fn.win_execute(
        args.denops,
        await fn.bufwinid(args.denops, bufnr),
        // winid,
        `call cursor(1, 1)`,
      );
    }

    await fn.win_execute(
      args.denops,
      await fn.bufwinid(args.denops, bufnr),
      "normal! zb",
    );
    if (args.denops.meta.host == "vim") {
      args.denops.cmd("redraw");
    }

    this.saveCursor = ensureArray(await fn.getcurpos(args.denops), isNumber);

    this.refreshed = false;
  }

  async quit(args: {
    denops: Denops;
    context: Context;
    options: DduOptions;
    uiParams: Params;
  }): Promise<void> {
    // const ft = await op.filetype.getLocal(args.denops);
    // // console.log("close");
  }
  params(): Params {
    return {
      autoPreview: false,
      border: "single",
      highlights: "NormalFloat",
      prompt: "",
      promptPosition: "top",
      split: "vertical",
      winHeightRate: 0.8,
      winWidthRate: 0.8,
    };
  }

  private async initBuffer(
    denops: Denops,
    bufferName: string,
  ): Promise<number> {
    const bufnr = await fn.bufadd(denops, bufferName);
    await fn.bufload(denops, bufnr);
    return Promise.resolve(bufnr);
  }
}
