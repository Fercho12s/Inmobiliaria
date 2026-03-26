import React from "react";
import { Composition } from "remotion";
import { PropertyReel, calculateMetadata, defaultProps } from "./compositions/PropertyReel";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="PropertyReel"
    component={PropertyReel}
    calculateMetadata={calculateMetadata}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={defaultProps}
  />
);
