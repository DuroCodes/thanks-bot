/* eslint-disable no-underscore-dangle */
import { PrismaClient } from '@prisma/client';
import { Logger } from '@spark.ts/logger';
import chalk from 'chalk';
import {
  Client, ClientEvents, ClientOptions, Collection, Colors, Routes,
} from 'discord.js';
import fastify from 'fastify';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Event, MessageCommand, SlashCommand } from '../structures/index.js';
import {
  colors, embedGenerator, emoji, globPromise,
} from '../util/index.js';
import { env } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename).replace(/\\/g, '/');

export interface DirectoryOptions {
  slashCommands?: string,
  events?: string,
}

export interface ExtendedClientOptions extends ClientOptions {
  directories?: DirectoryOptions;
  loggingEnabled?: boolean;
  serverEnabled?: boolean;
}

export class ExtendedClient extends Client {
  public messageCommands: Collection<string, MessageCommand> = new Collection();

  public slashCommands: Collection<string, SlashCommand> = new Collection();

  public messageCommandCooldowns: Collection<string, number> = new Collection();

  public slashCommandCooldowns: Collection<string, number> = new Collection();

  public directories?: DirectoryOptions = {
    slashCommands: 'slashCommands', events: 'events',
  };

  public loggingEnabled?: boolean;

  public serverEnabled?: boolean;

  public embeds = embedGenerator;

  public logger = new Logger({
    logLevel: 'success',
    logStyle: 'highlight',
  });

  public colors = { ...Colors, ...colors };

  public emoji = emoji;

  public prisma = new PrismaClient();

  constructor(options: ExtendedClientOptions) {
    super({ ...options });
    Object.assign(this, options);
  }

  start() {
    this.registerModules();
    this.login(env.BOT_TOKEN);
    if (this.serverEnabled) this.startServer();
  }

  async startServer() {
    const app = fastify({ logger: false });
    const port = env.PORT || 3000;

    app.get('/', (_req, rep) => rep.send('Hello server!'));

    app.listen({ port }, (err) => {
      if (err) {
        this.logger.error(err);
        process.exit(1);
      }
    });

    app.ready(() => {
      this.logger.info(`Listening on port ${chalk.bold(port)}`);
    });
  }

  async importFile(filePath: string) {
    return (await import(pathToFileURL(filePath).toString()))?.default;
  }

  async registerModules() {
    await this.registerEvents();
    await this.registerSlashCommands();
  }

  async registerEvents() {
    const eventFiles = await globPromise(`${__dirname}/../${this.directories?.events}/**/*{.ts,.js}`);
    eventFiles.forEach(async (path) => {
      const event: Event<keyof ClientEvents> = await this.importFile(path);
      if (!event.event || !event.run) return this.logger.warn('An event is missing a name or a run function!');
      if (this.loggingEnabled) this.logger.info(`${chalk.bold(event.event)} event loaded!`);

      if (event.once) return this.once(event.event, event.run);
      return this.on(event.event, event.run);
    });
  }

  async registerSlashCommands() {
    const commandFiles = await globPromise(`${__dirname}/../${this.directories?.slashCommands}/**/*{.ts,.js}`);

    for await (const path of commandFiles) {
      const command: SlashCommand = await this.importFile(path);
      if (!command?.name || !command?.description || !command?.run) return this.logger.warn('A slash command is missing a name, description, or run function!');
      if (this.loggingEnabled) this.logger.info(`${chalk.bold(command.name)} slash command loaded!`);

      this.slashCommands.set(command.name, command);
    }

    const body = this.slashCommands.map(
      ({ name, description, options }) => ({ name, description, options }),
    );

    try {
      await this.rest.put(Routes.applicationCommands(env.CLIENT_ID), {
        body,
      });

      this.logger.success('Registered all slash commands!');
    } catch (e) {
      this.logger.error(e);
    }
  }
}
