import { useState } from "react";
import { useTokenPrice } from "react-moralis";

const styles = {
  token: {
    padding: "0 2px",
    height: "42px",
    gap: "5px",
    width: "fit-content",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    whiteSpace: "nowrap",
  },
};

function TokenPriceWithAmount(props) {
  const { data: formattedData } = useTokenPrice(props);
  console.log(formattedData)

  const [isUSDMode, setIsUSDMode] = useState(true);

  const toggleDisplayStyle = () => setIsUSDMode(!isUSDMode);

  const noLogoToken = "https://etherscan.io/images/main/empty-token.png";

  return (
    <div style={styles.token}>
      <img src={props.image || noLogoToken} alt="logo" style={{ height: props?.size || "35px" }} />
      <span style={{ cursor: "pointer", textAlign: "center", whiteSpace: "nowrap", color: "var(--color-black)", fontWeight: "500", fontSize: "12px" }} onClick={toggleDisplayStyle} title={`Show in ${isUSDMode ? "FTM" : "USD"}`}>
        {formattedData && Math.round(Number(formattedData?.nativePrice?.value ?? 0) / Math.pow(10, 18) * (props?.amount?? 0) * 100) /100} FTM
      </span>
    </div>
  );
}
export default TokenPriceWithAmount;
