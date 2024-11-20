import type {Meta, StoryObj} from '@storybook/react';
import IconAdd from 'toolbar/components/icon/IconAdd';
import IconChat from 'toolbar/components/icon/IconChat';
import IconChevron from 'toolbar/components/icon/IconChevron';
import IconClose from 'toolbar/components/icon/IconClose';
import IconFatal from 'toolbar/components/icon/IconFatal';
import IconFlag from 'toolbar/components/icon/IconFlag';
import IconImage from 'toolbar/components/icon/IconImage';
import IconIssues from 'toolbar/components/icon/IconIssues';
import IconLock from 'toolbar/components/icon/IconLock';
import IconMegaphone from 'toolbar/components/icon/IconMegaphone';
import IconPin from 'toolbar/components/icon/IconPin';
import IconPlay from 'toolbar/components/icon/IconPlay';
import IconQuestion from 'toolbar/components/icon/IconQuestion';
import IconSentry from 'toolbar/components/icon/IconSentry';
import IconSettings from 'toolbar/components/icon/IconSettings';
import SVGIconBase from 'toolbar/components/icon/SVGIconBase';
import {iconSizes} from 'toolbar/components/icon/types';

const icons = {
  IconAdd,
  IconChat,
  IconChevron,
  IconClose,
  IconFatal,
  IconFlag,
  IconImage,
  IconIssues,
  IconLock,
  IconMegaphone,
  IconPin,
  IconPlay,
  IconQuestion,
  IconSentry,
  IconSettings,
};

const meta: Meta<typeof SVGIconBase> = {
  title: 'Components/icon/SVGIconBase',
  component: SVGIconBase,
  argTypes: {
    platform: {
      control: 'select',
      options: Object.keys(icons),
    },
    size: {
      control: 'select',
      options: Object.keys(iconSizes),
    },
  },
};

export default meta;
type Story = StoryObj<typeof SVGIconBase>;

export const All: Story = {
  args: {
    size: 'md',
  },
};

All.decorators = [
  () => {
    return (
      <div className="grid grid-flow-row gap-1">
        {Object.entries(icons).map(([name, Icon]) => (
          <span key={name}>
            <Icon {...All.args} />
            {name}
          </span>
        ))}
      </div>
    );
  },
];

export const Sizes: Story = {
  args: {},
};

Sizes.decorators = [
  () => {
    return (
      <div className="flex flex-row flex-wrap gap-1">
        {Object.keys(iconSizes).map(size => (
          <span key={size}>
            <IconAdd {...Sizes.args} size={size} />
            {size}
          </span>
        ))}
      </div>
    );
  },
];
