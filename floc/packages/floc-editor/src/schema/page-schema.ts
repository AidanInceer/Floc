/** Every node and mark a notes page is made of (#408). The editor adds behaviour on top. */
import { getSchema, type AnyExtension } from "@tiptap/core";

import { Bullet, Check, Divider, Heading, Numbered, PageDocument, Paragraph, Quote, Text } from "./blocks";
import { HardBreak, TripLink } from "./inline";
import { Bold, Comment, Highlight, Italic, Link, Strike, Underline } from "./marks";
import { Table, TableCell, TableRow } from "./table";

export const PAGE_NODES: AnyExtension[] = [
  PageDocument, Text, Paragraph, Heading, Bullet, Numbered, Check, Quote, Divider, Table, TableRow, TableCell, HardBreak, TripLink,
];
export const PAGE_MARKS: AnyExtension[] = [Bold, Italic, Underline, Strike, Link, Highlight, Comment];

export const pageSchema = () => getSchema([...PAGE_NODES, ...PAGE_MARKS]);
