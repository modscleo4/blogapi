/**
 * Copyright 2024 Dhiego Cassiano Fogaça Barbosa
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export type Channel = {
    /** The name of the channel. It's how people refer to your service. If you have an HTML website that contains the same information as your RSS file, the title of your channel should be the same as the title of your website. */
    title: string;
    /** The URL to the HTML website corresponding to the channel. */
    link: string;
    /** Phrase or sentence describing the channel. */
    description: string;
    /** The language the channel is written in. This allows aggregators to group all Italian language sites, for example, on a single page. */
    language?: string;
    /** Copyright notice for content in the channel. */
    copyright?: string;
    /** Email address for person responsible for editorial content. */
    managingEditor?: string;
    /** Email address for person responsible for technical issues relating to channel. */
    webMaster?: string;
    /** The publication date for the content in the channel. All date-times in RSS conform to the Date and Time Specification of RFC 822, with the exception that the year may be expressed with two characters or four characters (four preferred). */
    pubDate?: Date;
    /** The last time the content of the channel changed. */
    lastBuildDate?: Date;
    /** Specify one or more categories that the channel belongs to. Follows the same rules as the <item>-level category element. */
    category?: (string | Category)[];
    /** A string indicating the program used to generate the channel. */
    generator?: string;
    /** A URL that points to the documentation for the format used in the RSS file. */
    docs?: string;
    /** Allows processes to register with a cloud to be notified of updates to the channel, implementing a lightweight publish-subscribe protocol for RSS feeds. */
    cloud?: Cloud;
    /** ttl stands for time to live. It's a number of minutes that indicates how long a channel can be cached before refreshing from the source. */
    ttl?: number;
    /** Specifies a GIF, JPEG or PNG image that can be displayed with the channel. */
    image?: Image;
    /** The PICS rating for the channel. */
    rating?: string;
    /** The text input area for the channel. */
    textInput?: TextInput;
    /** A hint for aggregators telling them which hours they can skip. */
    skipHours?: number[];
    /** A hint for aggregators telling them which days they can skip. */
    skipDays?: Day[];
    /** A channel may contain any number of <item>s. An item may represent a "story" -- much like a story in a newspaper or magazine; if so its description is a synopsis of the story, and the link points to the full story. */
    items: Item[];
};

export type Item = ({
    /** The title of the item. */
    title: string;
} | {
    /** The item synopsis. */
    description: string;
}) & {
    /** The URL of the item. */
    link?: string;
    /** Email address of the author of the item. */
    author?: string;
    /** Includes the item in one or more categories. */
    category?: (string | Category)[];
    /** URL of a page for comments relating to the item. */
    comments?: string;
    /** Describes a media object that is attached to the item. */
    enclosure?: Enclosure;
    /** A string that uniquely identifies the item. */
    guid?: string | GUID;
    /** Indicates when the item was published. */
    pubDate?: Date;
    /** The RSS channel that the item came from. */
    source?: string;
};

export type Category = {
    /** A forward-slash-separated string that identifies a hierarchic location in the indicated taxonomy. */
    name: string;
    /** A string that identifies a categorization taxonomy. */
    domain?: string;
};

export type Image = {
    /** The URL of a GIF, JPEG or PNG image that represents the channel. */
    url: string;
    /** Describes the image, it's used in the ALT attribute of the HTML img tag when the channel is rendered in HTML. */
    title: string;
    /** The URL of the site, when the channel is rendered, the image is a link to the site. */
    link: string;
    /** The width of the image in pixels. */
    width?: number;
    /** The height of the image in pixels. */
    height?: number;
};

export type Cloud = {
    /** The domain name of the cloud. */
    domain: string;
    /** The port number of the cloud. */
    port: number;
    /** The path to the cloud. */
    path: string;
    /** The registerProcedure is the name of the procedure to call to register for the cloud. */
    registerProcedure: string;
    /** The protocol to use. */
    protocol: string;
};

export type TextInput = {
    /** The label of the Submit button in the text input area. */
    title: string;
    /** Explains the text input area. */
    description: string;
    /** The name of the text object in the text input area. */
    name: string;
    /** The URL of the CGI script that processes text input requests. */
    link: string;
};

export type Day = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export type Enclosure = {
    /** The URL to the object. */
    url: string;
    /** The length of the object in bytes. */
    length: number;
    /** The standard MIME type of the object. */
    type: string;
};

export type GUID = {
    /** The value of the GUID. */
    value: string;
    /** Is it a permalink (that is, a url that can be opened in a Web browser)? */
    isPermaLink: boolean;
};

function escapeHTML(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function rss(channel: Channel): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
    <channel>
        <title>${channel.title}</title>
        <link>${channel.link}</link>
        <description>${channel.description}</description>
        ${channel.language ? `<language>${channel.language}</language>` : ''}
        ${channel.managingEditor ? `<managingEditor>${channel.managingEditor}</managingEditor>` : ''}
        ${channel.webMaster ? `<webMaster>${channel.webMaster}</webMaster>` : ''}
        ${channel.pubDate ? `<pubDate>${channel.pubDate.toUTCString()}</pubDate>` : ''}
        ${channel.lastBuildDate ? `<lastBuildDate>${channel.lastBuildDate.toUTCString()}</lastBuildDate>` : ''}
        ${channel.category ? channel.category.map(category => typeof category === 'string' ? `<category>${category}</category>` : `<category domain="${category.domain}">${category.name}</category>`).join(`
        `) : ''}
        ${channel.generator ? `<generator>${channel.generator}</generator>` : ''}
        ${channel.docs ? `<docs>${channel.docs}</docs>` : ''}
        ${channel.cloud ? `<cloud domain="${channel.cloud.domain}" port="${channel.cloud.port}" path="${channel.cloud.path}" registerProcedure="${channel.cloud.registerProcedure}" protocol="${channel.cloud.protocol}" />` : ''}
        ${channel.ttl ? `<ttl>${channel.ttl}</ttl>` : ''}
        ${channel.image ? `<image>
            <url>${channel.image.url}</url>
            <title>${channel.image.title}</title>
            <link>${channel.image.link}</link>
            ${channel.image.width !== undefined ? `<width>${channel.image.width}</width>` : ''}
            ${channel.image.height !== undefined ? `<height>${channel.image.height}</height>` : ''}
        </image>` : ''}
        ${channel.rating ? `<rating>${channel.rating}</rating>` : ''}
        ${channel.textInput ? `<textInput>
            <title>${channel.textInput.title}</title>
            <description>${channel.textInput.description}</description>
            <name>${channel.textInput.name}</name>
            <link>${channel.textInput.link}</link>
        </textInput>` : ''}
        ${channel.skipHours ? `<skipHours>${channel.skipHours.map(hour => `
            <hour>${hour}</hour>`).join('')}
        </skipHours>` : ''}
        ${channel.skipDays ? `<skipDays>${channel.skipDays.map(day => `
            <day>${day}</day>`).join('')}
        </skipDays>` : ''}
        ${channel.items.map(item => `
        <item>
            ${'title' in item ? `<title>${escapeHTML(item.title)}</title>` : ''}
            ${'description' in item ? `<description>${escapeHTML(item.description)}</description>` : ''}
            ${item.link ? `<link>${item.link}</link>` : ''}
            ${item.author ? `<author>${item.author}</author>` : ''}
            ${item.category ? item.category.map(category => `<category>${category}</category>`).join(`
            `) : ''}
            ${item.comments ? `<comments>${item.comments}</comments>` : ''}
            ${item.enclosure ? `<enclosure url="${item.enclosure.url}" length="${item.enclosure.length}" type="${item.enclosure.type}" />` : ''}
            ${typeof item.guid === 'string' ? `<guid>${item.guid}</guid>` : item.guid ? `<guid isPermaLink="${item.guid.isPermaLink}">${item.guid.value}</guid>` : ''}
            ${item.pubDate ? `<pubDate>${item.pubDate.toUTCString()}</pubDate>` : ''}
            ${item.source ? `<source>${item.source}</source>` : ''}
        </item>`).join('')}
    </channel>
</rss>
`.replace(/^\s*\n/gm, '');
}
