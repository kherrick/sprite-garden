import localForage from "../../../deps/localForage.mjs";

export async function updateMovementScaleUI(doc) {
  let movementScaleValue = await localForage.getItem(
    `sprite-garden-movement-scale`,
  );

  if (!movementScaleValue) {
    movementScaleValue = 1;

    await localForage.setItem(
      "sprite-garden-movement-scale",
      movementScaleValue,
    );
  }

  doc.querySelector('[data-key="x"].middle').innerHTML =
    `&times;${Number(movementScaleValue)}`;
}

export async function updateMovementScaleValue(doc) {
  const movementScaleValue = Number(
    Number(await localForage.getItem("sprite-garden-movement-scale")) || 1,
  );

  let newMovementScaleValue = Number(
    Number(movementScaleValue.toFixed(2)) + 0.125,
  );

  if (newMovementScaleValue > 1) {
    newMovementScaleValue = Number(newMovementScaleValue.toFixed(1));
  }

  if (newMovementScaleValue > 1) {
    newMovementScaleValue = Number(0.5);
  }

  await localForage.setItem(
    `sprite-garden-movement-scale`,
    newMovementScaleValue,
  );

  await updateMovementScaleUI(doc);
}
