/* eslint-disable react/prop-types */
import cx from "classnames";
import PropTypes from "prop-types";
import { Component } from "react";

import { Ellipsified } from "metabase/core/components/Ellipsified";
import Tooltip from "metabase/core/components/Tooltip";
import CS from "metabase/css/core/index.css";
import { Icon } from "metabase/ui";

import { IconContainer } from "./LegendItem.styled";

const propTypes = {
  icon: PropTypes.object,
};

export default class LegendItem extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {};
  }

  static defaultProps = {
    showDot: true,
    showTitle: true,
    isMuted: false,
    showTooltip: true,
    showDotTooltip: true,
  };

  render() {
    const {
      title,
      color,
      icon,
      showDot,
      showTitle,
      isMuted,
      showTooltip,
      showDotTooltip,
      onMouseEnter,
      onMouseLeave,
      className,
      description,
      onClick,
      infoClassName,
    } = this.props;

    return (
      <span
        className={cx(
          className,
          "LegendItem",
          CS.noDecoration,
          "fullscreen-normal-text fullscreen-night-text",
          CS.flex,
          CS.alignCenter,
          {
            [CS.mr1]: showTitle,
            [CS.cursorPointer]: onClick,
          },
        )}
        style={{
          overflowX: "hidden",
          flex: "0 1 auto",
          opacity: isMuted ? 0.4 : 1,
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
      >
        {icon && (
          <IconContainer>
            <Icon {...icon} />
          </IconContainer>
        )}
        {showDot && (
          <Tooltip tooltip={title} isEnabled={showTooltip && showDotTooltip}>
            <div
              className={cx("flex-no-shrink", "inline-block circular")}
              style={{
                width: 13,
                height: 13,
                margin: 4,
                marginRight: 8,
                backgroundColor: color,
              }}
            />
          </Tooltip>
        )}
        {showTitle && (
          <div className="flex align-center overflow-hidden">
            <Ellipsified showTooltip={showTooltip}>{title}</Ellipsified>
            {description && (
              <div className="hover-child ml1 flex align-center text-medium">
                <Tooltip tooltip={description} maxWidth="22em">
                  <Icon className={infoClassName} name="info" />
                </Tooltip>
              </div>
            )}
          </div>
        )}
      </span>
    );
  }
}

LegendItem.propTypes = propTypes;
